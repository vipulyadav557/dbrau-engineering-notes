# DBRAU Engineering Notes

A college study website for B.Tech students covering 1st year to 4th year, all applicable semesters, notes, and previous year question papers (PYQs).

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [MongoDB](https://www.mongodb.com/) (local installation or [MongoDB Atlas](https://www.mongodb.com/atlas) account)

## Installation

1. Navigate to the project directory:
   `ash
   cd dbrau-engineering-notes
   `

2. Install dependencies:
   `ash
   npm install
   `

## Environment Setup

1. Copy the example environment file:
   `ash
   cp .env.example .env
   `

2. Update the .env file with your configuration:
   - PORT - Server port (default: 3000)
   - MONGODB_URI - MongoDB connection string

### MongoDB Configuration

#### For local MongoDB:
`env
MONGODB_URI=mongodb://localhost:27017/dbrau_engineering_notes
`

#### For MongoDB Atlas (later):
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user and whitelist your IP address
3. Get your connection string and update .env:
   `env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dbrau_engineering_notes
   `
4. Replace <username>, <password>, and cluster details with your actual values

**Note:** The server can start without MongoDB configured. It will display a clear message and continue running in development mode.

## Starting the Server

### Development mode (with auto-restart):
`ash
npm run dev
`

### Production mode:
`ash
npm start
`

The server will start on http://localhost:3000 (or the port specified in .env).

## Testing

### Test the health endpoint:
`ash
curl http://localhost:3000/api/health
`

Or open in your browser: [http://localhost:3000/api/health](http://localhost:3000/api/health)

Expected response:
`json
{
  \"status\": \"ok\",
  \"message\": \"DBRAU Engineering Notes server is running\",
  \"timestamp\": \"2024-...T...Z\"
}
`

## Project Structure

`
dbrau-engineering-notes/
  public/         # Static files (CSS, JS, images)
  views/          # View templates
  models/         # Mongoose models
  routes/         # Route definitions
  controllers/    # Route controllers
  middleware/     # Custom middleware
  config/         # Configuration files (database, etc.)
  server.js       # Main application entry point
`

## Notes

- This is Step 1 of the project setup. Additional features will be added in subsequent steps.
- Do not commit .env file to version control.
- Logo is located at public/images/dbrau-logo.png.
