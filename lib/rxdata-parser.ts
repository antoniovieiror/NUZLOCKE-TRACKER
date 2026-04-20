/**
 * Parser for RPG Maker XP / Pokémon Essentials .rxdata save files.
 *
 * A PE save file is a series of concatenated Ruby Marshal 4.8 streams
 * (one Marshal.dump per game variable). Each stream starts with 0x04 0x08.
 *
 * We iterate over all streams and collect:
 *   - PokeBattle_Trainer  → @party (team), @badges
 *   - PokemonStorage / PokemonBoxStorage  → @boxes[0].@pokemon (PC Box 1)
 *
 * Species IDs follow the national dex; PokéAPI accepts them as numeric IDs.
 */

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ParsedPokemon {
  /** National dex ID as a string (e.g. "700"). PokéAPI accepts this directly. */
  speciesId: string
  /** In-game nickname (gender byte stripped, uppercased). */
  nickname: string
}

export interface ParsedSaveData {
  party: ParsedPokemon[]
  box1: ParsedPokemon[]
  graveyard: ParsedPokemon[]
  badgeCount: number
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

function isStorageClass(name: string): boolean {
  const n = name.toLowerCase()
  return n.includes('storage') && n.includes('pokemon')
}

// ─── Single-stream parser factory ────────────────────────────────────────────
// Returns a function that reads one value from the shared byte array.
// symTable and objTable are per-stream (reset between streams).

function makeStreamReader(u8: Uint8Array, startPos: number) {
  let pos = startPos
  const symTable: string[] = []
  const objTable: MarshalValue[] = []

  function readByte(): number {
    if (pos >= u8.length) throw new RxdataParseError('Unexpected end of file')
    return u8[pos++]
  }

  function readInt(): number {
    const raw = readByte()
    const c = raw > 127 ? raw - 256 : raw

    if (c === 0) return 0
    if (c > 4) return c - 5
    if (c < -4) return c + 5

    if (c > 0) {
      let x = 0
      for (let i = 0; i < c; i++) x |= readByte() << (8 * i)
      return x
    }

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

  function readRawStr(): string {
    const len = readInt()
    const bytes = readBytes(len)
    return Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  }

  function readValue(): MarshalValue {
    const tag = readByte()
    switch (tag) {
      case 0x30: return null
      case 0x54: return true
      case 0x46: return false

      case 0x69: return readInt()

      case 0x6c: {
        const idx = objTable.length
        objTable.push(0)
        readByte() // sign
        const words = readInt()
        for (let i = 0; i < words; i++) { readByte(); readByte() }
        objTable[idx] = 0
        return 0
      }

      case 0x66: {
        const s = readRawStr()
        const v = parseFloat(s)
        objTable.push(v)
        return v
      }

      case 0x22: {
        const s = readRawStr()
        objTable.push(s)
        return s
      }

      case 0x3a: {
        const len = readInt()
        const bytes = readBytes(len)
        const sym = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
        symTable.push(sym)
        return sym
      }

      case 0x3b: {
        const idx = readInt()
        const sym = symTable[idx]
        if (sym === undefined) throw new RxdataParseError(`Symbol ref ${idx} out of range`)
        return sym
      }

      case 0x40: {
        const idx = readInt()
        return objTable[idx] ?? null
      }

      case 0x5b: {
        const count = readInt()
        const arr: MarshalValue[] = []
        const idx = objTable.length
        objTable.push(arr)
        for (let i = 0; i < count; i++) arr.push(readValue())
        return arr
      }

      case 0x6f: {
        const classNameRaw = readValue()
        const className = typeof classNameRaw === 'string' ? classNameRaw : String(classNameRaw)
        const obj: MarshalObject = { className, ivars: {} }
        const idx = objTable.length
        objTable.push(obj)
        const count = readInt()
        for (let i = 0; i < count; i++) {
          const keyRaw = readValue()
          const key = typeof keyRaw === 'string' ? keyRaw : String(keyRaw)
          obj.ivars[key] = readValue()
        }
        return obj
      }

      case 0x75: {
        readValue() // class name symbol
        const data = readRawStr()
        const v = data as unknown as MarshalValue
        objTable.push(v)
        return v
      }

      case 0x7b: {
        const count = readInt()
        const hash: Record<string, MarshalValue> = {}
        objTable.push(hash as unknown as MarshalValue)
        for (let i = 0; i < count; i++) {
          const k = readValue()
          hash[String(k)] = readValue()
        }
        return hash as unknown as MarshalValue
      }

      case 0x7c: {
        const count = readInt()
        const hash: Record<string, MarshalValue> = {}
        objTable.push(hash as unknown as MarshalValue)
        for (let i = 0; i < count; i++) {
          const k = readValue()
          hash[String(k)] = readValue()
        }
        readValue() // default value
        return hash as unknown as MarshalValue
      }

      default:
        throw new RxdataParseError(
          `Tag Marshal desconocido: 0x${tag.toString(16).padStart(2, '0')} en offset ${pos - 1}`
        )
    }
  }

  return {
    readValue,
    getPos: () => pos,
    getObjTable: () => objTable,
  }
}

// ─── Data extraction helpers ──────────────────────────────────────────────────

function toPokemon(entry: MarshalValue): ParsedPokemon | null {
  if (!isMarshalObject(entry)) return null
  const speciesRaw = entry.ivars['@species']
  const nameRaw = entry.ivars['@name']
  if (typeof speciesRaw !== 'number' || speciesRaw <= 0) return null
  const rawNick = typeof nameRaw === 'string' ? nameRaw : ''
  const nickname = rawNick.replace(/^[><]/, '').toUpperCase()
  return { speciesId: String(speciesRaw), nickname }
}

function extractBox1(storage: MarshalObject): ParsedPokemon[] {
  const boxes = storage.ivars['@boxes']
  if (!Array.isArray(boxes) || boxes.length === 0) return []

  const firstBox = boxes[0]

  // Box can be a PokemonBox object (with @pokemon ivar) or a bare array
  let slots: MarshalValue[]
  if (Array.isArray(firstBox)) {
    slots = firstBox
  } else if (isMarshalObject(firstBox)) {
    const pkmn = firstBox.ivars['@pokemon']
    slots = Array.isArray(pkmn) ? pkmn : []
  } else {
    return []
  }

  return slots.flatMap((slot) => {
    const p = toPokemon(slot)
    return p ? [p] : []
  })
}

function extractBoxRange(storage: MarshalObject, startIndex: number, endIndex: number): ParsedPokemon[] {
  const boxes = storage.ivars['@boxes']
  if (!Array.isArray(boxes)) return []

  const result: ParsedPokemon[] = []

  for (let i = startIndex; i <= endIndex && i < boxes.length; i++) {
    const box = boxes[i]
    let slots: MarshalValue[]

    if (Array.isArray(box)) {
      slots = box
    } else if (isMarshalObject(box)) {
      const pkmn = box.ivars['@pokemon']
      slots = Array.isArray(pkmn) ? pkmn : []
    } else {
      continue
    }

    for (const slot of slots) {
      const p = toPokemon(slot)
      if (p) result.push(p)
    }
  }

  return result
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function parseRxdata(buffer: ArrayBuffer): ParsedSaveData {
  const u8 = new Uint8Array(buffer)

  if (u8.length < 2 || u8[0] !== 0x04 || u8[1] !== 0x08) {
    throw new RxdataParseError(
      'El archivo no parece ser un guardado válido (cabecera Marshal no encontrada).'
    )
  }

  let pos = 2
  let foundTrainer: MarshalObject | null = null
  let foundStorage: MarshalObject | null = null

  // Search a parsed stream's object table for trainer and storage objects.
  // We look in objTable too because storage can be nested inside the trainer stream.
  function scanStream(root: MarshalValue, objTable: MarshalValue[]) {
    const candidates = [root, ...objTable]
    for (const obj of candidates) {
      if (!isMarshalObject(obj)) continue
      if (!foundTrainer && obj.className === 'PokeBattle_Trainer') foundTrainer = obj
      if (!foundStorage && isStorageClass(obj.className)) foundStorage = obj
    }
  }

  // Iterate over all concatenated Marshal streams until we have what we need
  let streamCount = 0
  while (pos < u8.length && (!foundTrainer || !foundStorage)) {
    // Every stream (after the first) starts with a fresh 04 08 header
    if (streamCount > 0) {
      if (pos + 1 >= u8.length || u8[pos] !== 0x04 || u8[pos + 1] !== 0x08) break
      pos += 2
    }

    const reader = makeStreamReader(u8, pos)
    try {
      const root = reader.readValue()
      pos = reader.getPos()
      scanStream(root, reader.getObjTable())
    } catch {
      break // corrupt / unknown stream — stop gracefully
    }

    streamCount++
    if (streamCount > 50) break // safety cap
  }

  // ── Extract party ──────────────────────────────────────────────────────────

  if (!foundTrainer) {
    throw new RxdataParseError(
      'No se encontró PokeBattle_Trainer en el archivo. ¿Es este el guardado correcto?'
    )
  }

  const trainer = foundTrainer as MarshalObject
  const partyRaw = trainer.ivars['@party']
  if (!Array.isArray(partyRaw)) {
    throw new RxdataParseError('@party no encontrado o no es un array.')
  }

  const party: ParsedPokemon[] = partyRaw.flatMap((e) => {
    const p = toPokemon(e)
    return p ? [p] : []
  })

  if (party.length === 0) {
    throw new RxdataParseError('No se encontraron Pokémon en el equipo. ¿Es este el archivo correcto?')
  }

  // ── Extract badges ─────────────────────────────────────────────────────────

  let badgeCount = 0
  const badgesRaw = trainer.ivars['@badges']
  if (Array.isArray(badgesRaw)) {
    badgeCount = badgesRaw.filter((b) => b === true).length
  }

  // ── Extract Box 1 ──────────────────────────────────────────────────────────

  const box1 = foundStorage ? extractBox1(foundStorage) : []

  // ── Extract Graveyard (boxes 15–36, indices 14–35) ────────────────────────

  const graveyard = foundStorage ? extractBoxRange(foundStorage as MarshalObject, 14, 35) : []

  return { party, box1, graveyard, badgeCount }
}

// ─── Species name normalizer (symbol-style IDs, if ever needed) ──────────────

export function normalizeSpeciesName(raw: string): string {
  return raw.trim().toLowerCase().replace(/_/g, '-')
}
