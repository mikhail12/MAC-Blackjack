# About me
Mikhail Romadinov - mrom0015@student.monash.edu or misha.romadinov@gmail.com or mikhail.romadinov@wisetechglobal.com
[Deployed App](https://mac-blackjack.vercel.app/)

# Assumptions
In my interpretation of the assumptions, updates to the chips/user balance can only be done server-side. With regards to the game in action, I assume the logic can be done locally, with updates to the history going through verification (such as checking cards aren't changed between turns, etc.).

Players dont have direct update permissions on the game table, instead, they update the current game through a postgres function in supabase.

# Stack: Nuxt

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build
```

Locally preview production build:

```bash
# npm
npm run preview
```
