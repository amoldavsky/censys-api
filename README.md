# Censys Asset Management API

A modern REST API built with Hono framework for cybersecurity asset management and analysis. This API provides JSON file upload capabilities with intelligent asset type detection and MongoDB persistence.

## 🚀 Features

- **Hono Framework**: Fast, lightweight web framework with TypeScript support
- **Asset Type Detection**: Intelligent classification of uploaded files into web and host asset types
- **MongoDB Persistence**: Scalable document-based storage with automatic collection management
- **JSON File Processing**: Specialized handling for JSON asset files with metadata extraction
- **RESTful API**: Clean REST endpoints for asset management (CRUD operations)
- **Type-Safe Architecture**: Full TypeScript support with Zod schema validation
- **Health Monitoring**: Built-in health check and status endpoints
- **Comprehensive Testing**: Unit and integration tests with Bun test runner
- **Docker Support**: Complete containerized development environment

## POC Overview

See [POC_OVERVIEW.md](POC_OVERVIEW.md) for a high-level overview of the POC.

## 📁 Project Structure

```
censys/
├── src/
│   ├── app/
│   │   ├── index.ts
│   │   ├── middlewares/
│   │   │   ├── json-only.ts
│   │   │   └── pino-logger.ts
│   │   └── services/
│   │       ├── jobs.ts
│   │       └── summary.agent*.ts
│   ├── api/
│   │   ├── ops/
│   │   │   ├── ops.routes.ts
│   │   │   └── ops.controller.ts
│   │   └── v1/
│   │       ├── assets/
│   │       │   ├── assets.routes.ts
│   │       │   ├── assets.controller.ts
│   │       │   ├── assets.service.ts
│   │       │   ├── assets.store.ts
│   │       │   ├── asset-summary.*.ts
│   │       │   └── models/   # zod schemas + mongoose models
│   │       └── chat/
│   │           ├── chat.routes.ts
│   │           ├── chat.controller.ts
│   │           ├── chat.service.ts
│   │           └── models/
│   ├── db/
│   │   └── mongoose.ts
│   └── utils/
│       ├── logger.ts
│       └── response.ts
├── tests/
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env.example
```

## 🛠 Installation

### Prerequisites

- [Bun](https://bun.sh) v1.2.19 or later
- Node.js v18+ (for compatibility)
- [Docker](https://www.docker.com/) and Docker Compose (for MongoDB)
- OpenAI API key (optional, for AI features)
- curl + jq (for quick endpoint checks in examples)

### Install Dependencies

```bash
bun install
```

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `.env` and add your configuration:
```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
# For local dev
MONGODB_URL=mongodb://censys:censys_password@localhost:27017/censys?authSource=admin
```

> **Note**: The API works without an OpenAI key using fallback responses for testing.

### MongoDB Setup

The application requires MongoDB for data persistence. Recommended: use Docker Compose.

#### Option 1: Using Docker Compose (Recommended)

Start MongoDB and the application together:
```bash
bun run docker:dev
```

Or start only MongoDB:
```bash
bun run docker:mongodb
```

#### Option 2: Local MongoDB Installation

If you prefer to install MongoDB locally:

macOS (Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb/brew/mongodb-community
```

Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl enable --now mongod
```

### Database Setup

MongoDB will automatically create the database and collections when the application first connects. No migrations are needed.

## 🏃‍♂️ Running the Application

### Development Mode

1. Start MongoDB (if not using Docker Compose):
```bash
bun run docker:mongodb
```

2. Start the application:
```bash
bun run dev
```

3. Verify health endpoints:
```bash
curl -s http://localhost:3000/ | jq
curl -s http://localhost:3000/healthz | jq
curl -s http://localhost:3000/readyz | jq
```

### Production Mode

```bash
bun run start
```

### Using Docker Compose

For a complete development environment with MongoDB:

```bash
# Start everything (MongoDB + App)
bun run docker:dev

# View logs
bun run docker:logs

# Stop everything
bun run docker:down
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

### Quick Health Check

```bash
curl -s http://localhost:3000/ | jq
curl -s http://localhost:3000/healthz | jq
curl -s http://localhost:3000/readyz | jq
```

## 🧪 Testing

### Run All Tests

```bash
bun test
```

### Run Tests in Watch Mode

```bash
bun run test:watch
```

### Test Coverage

The test suite includes:

- **Unit Tests**: Asset service logic and type detection
- **Integration Tests**: API endpoint functionality and MongoDB operations
- **Persistence Tests**: Database operations and data integrity
- **Health Monitoring**: Health check endpoints and service status
- **Error Handling**: Edge cases and error conditions

### Test Structure

- `tests/health-endpoints.test.ts`: Tests for health check and monitoring endpoints
- `tests/api/v1/assets/assets-routes.test.ts`: Tests for asset API endpoints and HTTP handling
- `tests/api/v1/assets/assets-service.test.ts`: Tests for business logic and asset processing
- `tests/api/v1/assets/assets-store.test.ts`: Tests for MongoDB persistence operations
- `tests/setup.ts`: Test environment configuration with MongoDB test settings

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Endpoints

#### Asset Management (base: `/api/v1`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/assets/web/upload` | Upload JSON file with certificates array; creates/updates web assets |
| POST | `/assets/hosts/upload` | Upload JSON file with `hosts` array; creates/updates host assets |
| GET | `/assets/web` | List web assets |
| GET | `/assets/web/:id` | Get specific web asset by ID |
| GET | `/assets/web/:id/summary` | Get web asset security summary |
| GET | `/assets/hosts` | List host assets |
| GET | `/assets/hosts/:id` | Get specific host asset by ID |
| GET | `/assets/hosts/:id/summary` | Get host asset security summary |

#### Operations (base: `/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root info (message, version, uptime) |
| GET | `/healthz` | Liveness probe + db/jobs snapshot |
| GET | `/readyz` | Readiness probe (MongoDB ping) |
| GET | `/info` | Application information |
| GET | `/jobs` | In-memory jobs queue status |

### Example Requests

#### Upload JSON Files

- Web assets (certificates JSON):
```bash
curl -s -X POST http://localhost:3000/api/v1/assets/web/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@tests/api/v1/assets/web_properties_dataset.json" | jq
```

- Host assets (hosts JSON):
```bash
curl -s -X POST http://localhost:3000/api/v1/assets/hosts/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@tests/api/v1/assets/hosts_dataset.json" | jq
```

#### List and Retrieve Assets

```bash
# List web assets
curl -s http://localhost:3000/api/v1/assets/web | jq

# List host assets
curl -s http://localhost:3000/api/v1/assets/hosts | jq

# Get a specific web asset
curl -s http://localhost:3000/api/v1/assets/web/<id> | jq

# Get a specific host asset
curl -s http://localhost:3000/api/v1/assets/hosts/<id> | jq
```

#### Get Web Assets Only

```bash
curl -X GET http://localhost:3000/api/v1/assets/web
```

#### Get Host Assets Only

```bash
curl -X GET http://localhost:3000/api/v1/assets/hosts
```

### Asset Types & Processing

The API automatically detects and classifies uploaded JSON files into two asset types:

#### Web Assets
- **Detection**: Files containing web-related content (HTML tags, URLs, web technologies)
- **Metadata Extracted**:
  - URLs and domains found in content
  - Web technologies detected (React, Vue, Angular, etc.)
  - Potential vulnerabilities (placeholder for future enhancement)
- **Example Content**: Configuration files for web servers, frontend build configs, API definitions

#### Host Assets
- **Detection**: Files containing infrastructure-related content (IP addresses, hostnames, system configs)
- **Metadata Extracted**:
  - IP addresses and hostnames
  - Port numbers and services
  - Operating system information (when available)
- **Example Content**: Server configurations, network topology files, infrastructure inventories

### Asset Security Summaries

- Summaries are generated asynchronously via background jobs after uploads
- Endpoints:
  - `/api/v1/assets/web/:id/summary`
  - `/api/v1/assets/hosts/:id/summary`
- If not yet generated, endpoints return 404

### File Upload Specifications

- **Supported Format**: JSON only
- **Upload Method**: HTTP POST with JSON payload
- **Content Encoding**: Base64 encoded file content
- **Automatic Processing**: Files are analyzed and classified upon upload
- **Metadata Extraction**: Type-specific metadata is automatically extracted and stored

## 🔧 Development

### Available Scripts

```bash
# Development
bun run dev              # Start development server
bun run start            # Start production server

# Database
bun run docker:mongodb   # Start MongoDB container only
bun run docker:dev       # Start MongoDB + App with Docker Compose
bun run docker:down      # Stop all containers
bun run docker:logs      # Tail Docker Compose logs

# Testing
bun test                 # Run all tests
bun run test:watch       # Run tests in watch mode

# Building & Linting
bun run build            # Build for production
bun run lint             # Type check with TypeScript
```

### Adding New Features

1. **New API Endpoints**: Add routes in `src/api/v1/assets/assets.routes.ts`
2. **Business Logic**: Implement in `src/api/v1/assets/assets.service.ts`
3. **Persistence**: Update MongoDB operations in `src/api/v1/assets/assets.store.ts`
4. **Types**: Define TypeScript interfaces in `src/api/v1/assets/model/asset.model.ts`
5. **Validation**: Add Zod schemas in `src/api/v1/assets/model/asset.schema.ts`
6. **Tests**: Add corresponding tests in `tests/api/v1/assets/` directory

### Asset Management Architecture

The service uses a clean layered architecture for asset management:

#### Asset Type Detection
- **Purpose**: Automatically classifies uploaded JSON files as web or host assets
- **Logic**: Analyzes file content, names, and patterns to determine asset type
- **Metadata Extraction**: Extracts relevant metadata based on detected asset type

#### MongoDB Persistence
- **Collections**: Single `assets` collection with type-based organization
- **Documents**: Flexible schema supporting both web and host asset types
- **Operations**: Full CRUD operations with type-specific queries

#### Features
- **Automatic Classification**: No manual asset type specification required
- **Metadata Extraction**: Rich metadata automatically extracted from file content
- **Type-Safe Operations**: Full TypeScript support with discriminated unions
- **Scalable Storage**: MongoDB document model scales with asset complexity

## 🚀 Deployment

### Environment Variables

Ensure these environment variables are set in production:

```env
NODE_ENV=production
PORT=3000
MONGODB_URL=mongodb://username:password@host:port/database?authSource=admin
```

### Build for Production

```bash
bun run build
```

### Docker (Optional)

Create a `Dockerfile`:

```dockerfile
FROM oven/bun:1.2.19

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
EXPOSE 3000

CMD ["bun", "run", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Run tests: `bun test`
5. Commit your changes: `git commit -am 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

## 📄 License

This project was created using `bun init` in bun v1.2.19. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

---

**Built with ❤️ using Hono, MongoDB, and Bun**
