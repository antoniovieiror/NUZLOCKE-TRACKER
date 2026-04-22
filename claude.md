@AGENTS.md

# Requirements and Architecture Specification: Nuzlocke Tracker Web App

## 1. Product Vision
A closed web application to manage a Pokémon Nuzlocke tournament among a group of 5 friends. The app does not integrate with the game ROM; all state management is strictly manual. Its main function is to maintain a global classification (Leaderboard) based on periodic "leagues" (round-robin tournaments) played on Pokémon Showdown. It also serves as a hub where each player can showcase their current run status (team, badges, death counter).

## 2. Tech Stack
* **Frontend:** Next.js (App Router), React.
* **Styling & UI:** Tailwind CSS and shadcn/ui. The goal is a modern, clean, "SaaS dashboard" aesthetic (smooth border radii, clear typography, visual consistency, fully responsive).
* **Backend, Database & Auth:** Supabase (PostgreSQL).
* **External Integration:** PokéAPI (to fetch Pokémon names and sprites when building the team/box, avoiding DB bloat).
* **Deployment:** Vercel.

## 3. User Roles
* **Admin (1 user):**
  * Creates or enables accounts (no open registration).
  * Toggles user status between `active` and `inactive`.
  * Generates temporary passwords if someone forgets theirs (no email recovery system).
  * Creates and closes leagues.
  * Resolves match disputes or forces a resolution for pending matches (missing votes).
  * Has permission to edit other users' profiles if necessary.
* **Player:**
  * Logs in with a simple username/password.
  * Edits their own profile (current team, PC box, badges, deaths, personal notes).
  * Votes on the outcome of their matches in the active league.

## 4. Main Entities (Suggested Data Model)
* **User:** ID, Username, Password (handled by Supabase Auth), Role (`admin`/`player`), Status (`active`/`inactive`).
* **Profile:** 1:1 relationship with User.
  * *Manual fields:* Badges (Int), Deaths (Int), Team (Array of strings with Pokémon names to fetch via PokéAPI), Box (Array), MVP (String), Notes (Text), Avatar (URL).
  * *Calculated stats:* Total Points, Total Wins, Total Losses, Winrate.
* **League:** ID, Title, Status (`active`/`closed`), Created_at, Closed_at. **Only ONE league can be active at a time.**
* **Match:** ID, League_ID, Player_A_ID, Player_B_ID, Vote_A (`win_A`, `win_B`, `null`), Vote_B (`win_A`, `win_B`, `null`), Status (`pending`, `validated`, `disputed`, `voided`, `admin_resolved`), Winner_ID (nullable), Replay_URL (optional string).

## 5. Core Business Rules
1. **Scoring System:** Win = 2 points, Loss = 0 points. There are no draws.
2. **Voided Matches:** If a match is cancelled/voided, both players receive 0 points. **Important:** Voided matches do NOT count as a "played match" when calculating a player's Winrate.
3. **Voting System (Double-blind):**
   * If Player A and Player B vote for the same winner -> Match status becomes `validated`.
   * If their votes differ -> Match status becomes `disputed` -> Admin must resolve it manually.
   * If one or both votes are missing -> Match status remains `pending` -> Admin can force a resolution or void it.
4. **League Generation:** Upon creating a new league, the system fetches all users with an `active` status and automatically generates a unique *Round Robin* fixture (everybody plays everybody once).
5. **Global Leaderboard:** This is the main view (Home). It calculates rankings by summing up the historical points from all past and current leagues. Tiebreaker criteria: Total Points > Total Wins > Winrate > Alphabetical order.

## 6. Views and Application Pages
1. **Login:** Simple username and password screen.
2. **Home (Global Leaderboard):** Main table displaying the historical ranking. This is the visual core of the app. Includes quick links to the active league and player profiles.
3. **Player Profile:**
   * *Editable Section:* Numeric counters for badges and deaths. Autocomplete search input (via PokéAPI) to add up to 6 Pokémon to the team and N to the box. Text input for MVP and personal notes.
   * *Automated Section:* Historical stats and Pokémon team sprites loaded dynamically.
4. **Active League:** Displays the internal ranking for the current round (using the same scoring rules) and the list of all generated matches.
5. **Match View:** A card where the two involved players can cast their vote and optionally paste a Showdown replay link.
6. **League History:** Archive of leagues with `closed` status to check past results.
7. **Admin Panel:** Exclusive view for the admin to manage users (create/activate/reset passwords), manage leagues (create/close), and audit matches (resolve disputes/void matches).

## 7. Instructions for the AI Agent
1. Act as an expert Full-Stack Developer.
2. Based on this document, please design the Supabase database structure first (SQL schema or table definitions).
3. Next, generate the Next.js project scaffolding and the key UI components using Tailwind CSS and shadcn/ui.
4. Prioritize a premium, responsive UI/UX.
5. Do not assume or build complex features outside of this scope (e.g., do not add email password recovery or automated game state integrations). Stick strictly to the manual management described.
