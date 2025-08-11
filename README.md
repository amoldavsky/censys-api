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

## 📁 Project Structure

```
censys/
├── src/
│   ├── api/
│   │   └── v1/
│   │       └── assets/
│   │           ├── assets.routes.ts           # Asset API endpoints
│   │           ├── assets.service.ts          # Business logic & processing
│   │           ├── assets.store.ts            # MongoDB persistence layer
│   │           ├── model/
│   │           │   ├── asset.model.ts         # Domain models (Asset, WebAsset, HostAsset)
│   │           │   └── asset.schema.ts        # Zod validation schemas
│   │           ├── dto/
│   │           │   └── asset.dto.ts           # API data transfer objects
│   │           ├── mappers/
│   │           │   └── assets.mapper.ts        # Data transformation utilities
│   │           └── services/
│   │               └── asset-type-detector.ts # Asset type classification logic
│   ├── persistence/
│   │   ├── db.ts                              # MongoDB connection & collections
│   │   └── schema.ts                          # MongoDB document schemas
│   ├── lib/
│   │   └── logger.ts                          # Logging utilities
│   └── services/
│       └── mongoose.ts                # Database service wrapper
├── tests/
│   ├── setup.ts                               # Test configuration
│   ├── health-endpoints.test.ts               # Health check tests
│   └── api/v1/assets/
│       ├── assets-routes.test.ts              # API endpoint tests
│       ├── assets-service.test.ts             # Service unit tests
│       └── assets-store.test.ts               # Persistence layer tests
├── docker-compose.yml                         # MongoDB container setup
├── index.ts                                   # Main application entry point
├── package.json                               # Dependencies and scripts
├── tsconfig.json                              # TypeScript configuration
├── .env.example                               # Environment variables template
└── README.md                                  # This file
```

## 🛠 Installation

### Prerequisites

- [Bun](https://bun.sh) v1.2.19 or later
- Node.js v18+ (for compatibility)
- [Docker](https://www.docker.com/) and Docker Compose (for MongoDB)
- OpenAI API key (optional, for AI features)

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
MONGODB_URL=mongodb://censys:censys_password@localhost:27017/censys?authSource=admin
```

> **Note**: The API works without an OpenAI key using fallback responses for testing.

### MongoDB Setup

The application requires MongoDB for data persistence. You can run MongoDB using Docker:

#### Option 1: Using Docker Compose (Recommended)

Start MongoDB and the application together:
```bash
bun run docker:up
```

Or start only MongoDB:
```bash
bun run docker:mongodb
```

#### Option 2: Local MongoDB Installation

If you prefer to install MongoDB locally:

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew db start mongodb/brew/mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Database Setup

MongoDB will automatically create the database and collections when the application first connects. No migrations are needed.

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start MongoDB** (if not using Docker Compose):
```bash
bun run docker:mongodb
```

2. **Start the application**:
```bash
bun run dev
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

### Health Check

Once running, verify the API is working:

```bash
curl http://localhost:3000/
```

Expected response:
```json
{
  "message": "Censys API Server",
  "status": "healthy",
  "timestamp": "2025-08-08T14:00:00.000Z"
}
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

#### Asset Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/assets` | Upload JSON files and create assets |
| GET | `/assets` | Get all assets |
| GET | `/assets/web` | Get web assets only |
| GET | `/assets/hosts` | Get host assets only |
| GET | `/assets/hosts/:id` | Get specific host asset by ID |
| GET | `/assets/web/:id` | Get specific web asset by ID |
| GET | `/assets/web/:id/summary` | Get web asset security summary |
| GET | `/assets/hosts/:id/summary` | Get host asset security summary |

#### Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API root - basic health check |
| GET | `/livez` | Kubernetes liveness probe |
| GET | `/readyz` | Kubernetes readiness probe |
| GET | `/info` | Application information |
| GET | `/metrics` | Prometheus metrics |
| GET | `/assets/health` | Asset service health status |
| GET | `/assets/status` | Asset service detailed status |

### Example Requests

#### Upload JSON Files to Create Assets

```bash
curl -X POST http://localhost:3000/api/v1/assets \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {
        "name": "web-config.json",
        "type": "application/json",
        "size": 1024,
        "content": "eyJzZXJ2ZXIiOiAibmdpbngiLCAicG9ydCI6IDgwfQ=="
      },
      {
        "name": "hosts.json",
        "type": "application/json",
        "size": 512,
        "content": "eyJob3N0cyI6IFsiMTkyLjE2OC4xLjEiLCAiMTAuMC4wLjEiXX0="
      }
    ]
  }'
```

Response:
```json
{
  "data": {
    "id": "asset_1754661618495_abc123def",
    "type": "host",
    "files": [
      {
        "name": "web-config.json",
        "type": "application/json",
        "size": 1024,
        "content": "eyJzZXJ2ZXIiOiAibmdpbngiLCAicG9ydCI6IDgwfQ=="
      }
    ],
    "status": "processing",
    "createdAt": "2025-08-08T14:00:00.000Z",
    "hostMetadata": {
      "ipAddresses": ["192.168.1.1", "10.0.0.1"],
      "hostnames": [],
      "ports": [80],
      "services": ["nginx"],
      "operatingSystem": null
    }
  },
  "success": true
}
```

#### Get All Assets

```bash
curl -X GET http://localhost:3000/api/v1/assets
```

Response:
```json
{
  "data": [
    {
      "id": "asset_1754661618495_abc123def",
      "type": "host",
      "files": [...],
      "status": "completed",
      "createdAt": "2025-08-08T14:00:00.000Z",
      "hostMetadata": {
        "ipAddresses": ["192.168.1.1"],
        "hostnames": ["server.example.com"],
        "ports": [80, 443],
        "services": ["nginx", "docker"]
      },
      "processingResults": {
        "processedFiles": 2,
        "totalSize": 1536,
        "assetType": "host",
        "processingTimestamp": "2025-08-08T14:00:15.000Z"
      }
    }
  ],
  "success": true
}
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

The API provides AI-generated security summaries for both web and host assets. These summaries analyze the asset data and provide:

#### Summary Schema
- **id**: Asset identifier (domain for web assets, IP for host assets)
- **summary**: 2-4 sentence terse, specific, evidence-based summary
- **severity**: Risk level (low, medium, high, critical)
- **evidence**: Structured data including certificate info, security indicators
- **findings**: 1-5 short bullets citing specific data points
- **recommendations**: ≤4 prioritized, actionable security recommendations
- **assumptions**: Notes about missing/ambiguous fields that were inferred
- **data_coverage**: Percentage of fields present and list of missing fields

#### Summary Generation
- Summaries are automatically generated via background jobs when assets are uploaded
- Access summaries via `/api/v1/assets/web/:id/summary` or `/api/v1/assets/hosts/:id/summary`
- Returns 404 if no summary exists for the asset
- Summaries are stored separately in `web_asset_summaries` and `host_asset_summaries` collections

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
