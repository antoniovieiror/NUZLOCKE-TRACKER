/**
 * Parser for RPG Maker XP / Pokémon Essentials .rxdata save files.
 *
 * Format confirmed from hex dump of a real save:
 *  - Ruby Marshal 4.8 (magic: 0x04 0x08)
 *  - Top-level object: PokeBattle_Trainer
 *  - @party → Array of up to 6 PokeBattle_Pokemon objects (41 ivars each)
 *  - PokeBattle_Pokemon @name   → Ruby String  → player nickname
 *  - PokeBattle_Pokemon @species → Ruby Fixnum → national dex ID (PokéAPI-compatible)
 *  - PokeBattle_Trainer @badges  → Array<bool>  → true = badge earned
 *
 * Species IDs follow the national dex (700 = Sylveon, 493 = Arceus, etc.)
 * PokéAPI accepts numeric IDs directly, so we return them as strings.
 *
 * Box (PC storage) is not at the top level of this save layout — skipped per spec.
 */

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ParsedPokemon {
  /** National dex ID as a string (e.g. "700"). PokéAPI accepts this directly. */
  speciesId: string
  /** In-game nickname (leading gender byte stripped if present). */
  nickname: string
}

export interface ParsedSaveData {
  party: ParsedPokemon[]
  box1: ParsedPokemon[]   // always empty for this save format; box is stored separately
  badgeCount: number       // count of true values in @badges array
}

export class RxdataParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RxdataParseError'
  }
}

// ─── Internal Marshal types ───────────────────────────────────────────────────

interface MarshalObject {
  className: string
  ivars: Record<string, MarshalValue>
}

type MarshalValue =
  | null
  | boolean
  | number
  | string
  | MarshalValue[]
  | MarshalObject

function isMarshalObject(v: MarshalValue): v is MarshalObject {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && 'className' in v
}

// ─── Parser ───────────────────────────────────────────────────────────────────

export function parseRxdata(buffer: ArrayBuffer): ParsedSaveData {
  const u8 = new Uint8Array(buffer)
  let pos = 0

  const symTable: string[] = []
  // Object table: every string, array, object, bignum adds itself here.
  // We store MarshalValue | undefined so back-refs resolve correctly.
  const objTable: Array<MarshalValue> = []

  // ── Low-level readers ──────────────────────────────────────────────────────

  function readByte(): number {
    if (pos >= u8.length) throw new RxdataParseError('Unexpected end of file')
    return u8[pos++]
  }

  /**
   * Ruby Marshal integer encoding (matches r_long in Ruby source):
   *   0x00       → 0
   *   0x01..0x04 → read 1–4 bytes little-endian (unsigned)
   *   0x05..0x7f → byte − 5  (positive small, 0..122)
   *   0x80..0xfb → (byte − 256) + 5  (negative small, −123..−2)
   *   0xfc..0xff → read 1–4 bytes little-endian (signed, negative multi-byte)
   */
  function readInt(): number {
    const raw = readByte()
    const c = raw > 127 ? raw - 256 : raw   // interpret as signed byte

    if (c === 0) return 0
    if (c > 4) return c - 5
    if (c < -4) return c + 5

    if (c > 0) {
      let x = 0
      for (let i = 0; i < c; i++) x |= readByte() << (8 * i)
      return x
    }

    // c in [-4, -1]: negative multi-byte, sign-extend from -1
    let x = -1
    const n = -c
    for (let i = 0; i < n; i++) {
      x &= ~(0xff << (8 * i))
      x |= readByte() << (8 * i)
    }
    return x
  }

  function readBytes(len: number): Uint8Array {
    const slice = u8.slice(pos, pos + len)
    pos += len
    return slice
  }

  /** Read a length-prefixed byte array and decode as Latin-1. */
  function readRawStr(): string {
    const len = readInt()
    const bytes = readBytes(len)
    return Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  }

  // ── Marshal value reader ───────────────────────────────────────────────────

  function readValue(): MarshalValue {
    const tag = readByte()

    switch (tag) {
      // Scalars
      case 0x30: return null
      case 0x54: return true
      case 0x46: return false

      // Fixnum
      case 0x69: return readInt()

      // Bignum (sign + word_count + words) — value not needed, register in table
      case 0x6c: {
        const objIdx = objTable.length
        objTable.push(0)
        readByte() // sign ('+' or '-')
        const words = readInt()
        for (let i = 0; i < words; i++) { readByte(); readByte() }
        objTable[objIdx] = 0
        return 0
      }

      // Float stored as string representation
      case 0x66: {
        const s = readRawStr()
        const v = parseFloat(s)
        objTable.push(v)
        return v
      }

      // String
      case 0x22: {
        const s = readRawStr()
        objTable.push(s)
        return s
      }

      // New symbol (intern into symbol table)
      case 0x3a: {
        const len = readInt()
        const bytes = readBytes(len)
        const sym = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
        symTable.push(sym)
        return sym
      }

      // Symbol back-reference
      case 0x3b: {
        const idx = readInt()
        const sym = symTable[idx]
        if (sym === undefined) throw new RxdataParseError(`Symbol ref ${idx} out of range`)
        return sym
      }

      // Object back-reference
      case 0x40: {
        const idx = readInt()
        return objTable[idx] ?? null
      }

      // Array
      case 0x5b: {
        const count = readInt()
        const arr: MarshalValue[] = []
        const objIdx = objTable.length
        objTable.push(arr)
        for (let i = 0; i < count; i++) arr.push(readValue())
        return arr
      }

      // Object instance (o ClassName ivars…)
      case 0x6f: {
        const classNameRaw = readValue()
        const className = typeof classNameRaw === 'string' ? classNameRaw : String(classNameRaw)
        const obj: MarshalObject = { className, ivars: {} }
        const objIdx = objTable.length
        objTable.push(obj)
        const count = readInt()
        for (let i = 0; i < count; i++) {
          const keyRaw = readValue()
          const key = typeof keyRaw === 'string' ? keyRaw : String(keyRaw)
          obj.ivars[key] = readValue()
        }
        return obj
      }

      // User-defined (some PE classes use _dump/_load)
      case 0x75: {
        readValue() // class name symbol
        const data = readRawStr()
        const v = data as unknown as MarshalValue
        objTable.push(v)
        return v
      }

      // Hash
      case 0x7b: {
        const count = readInt()
        const hash: Record<string, MarshalValue> = {}
        const objIdx = objTable.length
        objTable.push(hash as unknown as MarshalValue)
        for (let i = 0; i < count; i++) {
          const k = readValue()
          hash[String(k)] = readValue()
        }
        return hash as unknown as MarshalValue
      }

      // Hash with default value
      case 0x7c: {
        const count = readInt()
        const hash: Record<string, MarshalValue> = {}
        objTable.push(hash as unknown as MarshalValue)
        for (let i = 0; i < count; i++) {
          const k = readValue()
          hash[String(k)] = readValue()
        }
        readValue() // default value — ignore
        return hash as unknown as MarshalValue
      }

      default:
        throw new RxdataParseError(
          `Tag Marshal desconocido: 0x${tag.toString(16).padStart(2, '0')} en offset ${pos - 1}`
        )
    }
  }

  // ── Entry point ────────────────────────────────────────────────────────────

  if (u8.length < 2 || u8[0] !== 0x04 || u8[1] !== 0x08) {
    throw new RxdataParseError(
      'El archivo no parece ser un guardado válido (cabecera Marshal no encontrada).'
    )
  }
  pos = 2

  const root = readValue()

  if (!isMarshalObject(root) || root.className !== 'PokeBattle_Trainer') {
    throw new RxdataParseError(
      `Se esperaba PokeBattle_Trainer, se encontró: ${isMarshalObject(root) ? root.className : typeof root}`
    )
  }

  // ── Extract @party ─────────────────────────────────────────────────────────

  const partyRaw = root.ivars['@party']
  if (!Array.isArray(partyRaw)) {
    throw new RxdataParseError('@party no encontrado o no es un array.')
  }

  const party: ParsedPokemon[] = []
  for (const entry of partyRaw) {
    if (!isMarshalObject(entry)) continue
    const speciesRaw = entry.ivars['@species']
    const nameRaw = entry.ivars['@name']
    if (typeof speciesRaw !== 'number' || speciesRaw <= 0) continue

    // Some games prepend a gender byte ('>','<') — strip it
    const rawNick = typeof nameRaw === 'string' ? nameRaw : ''
    const nickname = rawNick.replace(/^[><]/, '')

    party.push({ speciesId: String(speciesRaw), nickname })
  }

  if (party.length === 0) {
    throw new RxdataParseError('No se encontraron Pokémon en el equipo. ¿Es este el archivo correcto?')
  }

  // ── Extract @badges count ──────────────────────────────────────────────────

  let badgeCount = 0
  const badgesRaw = root.ivars['@badges']
  if (Array.isArray(badgesRaw)) {
    badgeCount = badgesRaw.filter((b) => b === true).length
  }

  return { party, box1: [], badgeCount }
}

// ─── Species name normalizer (for symbol-style IDs if ever needed) ─────────────

/**
 * Converts a Pokémon Essentials species token to a PokéAPI slug.
 * Only needed for games that store species as symbols instead of integers.
 * Examples: "CHARIZARD" → "charizard", "MR_MIME" → "mr-mime"
 */
export function normalizeSpeciesName(raw: string): string {
  return raw.trim().toLowerCase().replace(/_/g, '-')
}
