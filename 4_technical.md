# 4. Technical Architecture

## Technology Stack Overview

Badass TCG requires a robust, scalable technical architecture to handle complex game mechanics, real-time player interactions, and state management. This document outlines the core technologies and their implementations.

### Frontend Stack

```
+---------------------------------------------------------------------+
|                       FRONTEND ARCHITECTURE                          |
+---------------------------------------------------------------------+
|                                                                     |
|  +-------------------+      +------------------+                    |
|  |                   |      |                  |                    |
|  |  React SPA        |<---->|  Redux Store     |                    |
|  |  Component-based  |      |  Game State      |                    |
|  |                   |      |                  |                    |
|  +--------+----------+      +------------------+                    |
|           |                                                         |
|           v                                                         |
|  +--------+----------+      +------------------+                    |
|  |                   |      |                  |                    |
|  |  React Three.js   |<---->|  WebSocket      |                    |
|  |  Canvas Rendering |      |  Connection      |                    |
|  |                   |      |                  |                    |
|  +--------+----------+      +------------------+                    |
|           |                                                         |
|           v                                                         |
|  +--------+----------+      +------------------+                    |
|  |                   |      |                  |                    |
|  |  UI Component     |<---->|  Authentication  |                    |
|  |  Library          |      |  Service         |                    |
|  |                   |      |                  |                    |
|  +-------------------+      +------------------+                    |
|                                                                     |
+---------------------------------------------------------------------+
```

**Core Frontend Technologies**:

1. **React 18+**: Component-based UI library
   - Functional components with Hooks
   - Custom hooks for game mechanics
   - Context API for theme/settings

2. **Redux Toolkit**: State management
   - Normalized game state
   - Action creators for game events
   - Middleware for logging/debugging

3. **Three.js**: 3D card rendering
   - Card flip animations
   - Battlefield visualization
   - Particle effects for spells

4. **Socket.io Client**: Real-time communication
   - Bidirectional with server
   - Event-based architecture
   - Automatic reconnection

5. **TypeScript**: Type safety
   - Strict typing for game objects
   - Interface definitions
   - Enhanced developer experience

### Backend Stack

```
+---------------------------------------------------------------------+
|                        BACKEND ARCHITECTURE                          |
+---------------------------------------------------------------------+
|                                                                     |
|  +-------------------+      +------------------+                    |
|  |                   |      |                  |                    |
|  |  Express.js       |<---->|  Game Logic      |                    |
|  |  REST API         |      |  Engine          |                    |
|  |                   |      |                  |                    |
|  +--------+----------+      +------------------+                    |
|           |                          |                              |
|           v                          v                              |
|  +--------+----------+      +------------------+                    |
|  |                   |      |                  |                    |
|  |  Socket.io Server |<---->|  Redis           |                    |
|  |  Real-time Events |      |  State Cache     |                    |
|  |                   |      |                  |                    |
|  +--------+----------+      +------------------+                    |
|           |                          |                              |
|           v                          v                              |
|  +--------+----------+      +------------------+                    |
|  |                   |      |                  |
|  |  Authentication   |<---->|  Database        |
|  |  JWT / OAuth      |      |  SQLite          |
|  |                   |      |                  |
|  +-------------------+      +------------------+

**Core Backend Technologies**:

1. **Node.js**: JavaScript runtime
   - Event-driven architecture
   - Async processing for game events
   - Clustered for multi-core performance

2. **Express.js**: Web framework
   - REST API endpoints
   - Middleware architecture
   - Rate limiting and security

3. **Socket.io**: WebSocket server
   - Namespaces for game sessions
   - Rooms for matchmaking
   - Binary transmission for efficiency

4. **Redis**: In-memory data store
   - Game state caching
   - Pub/Sub for scaling
   - Session management

5. **SQLite**: Embedded database
   - Card catalog storage
   - User accounts and deck storage
   - Match history and statistics
   - Lightweight local deployment

## Real-Time Game State Management

### State Synchronization Strategy

Managing game state across multiple clients requires careful synchronization:

```
+-----------------------------------------------------+
|                                                     |
|  CLIENT A        SERVER            CLIENT B         |
|                                                     |
|    |               |                 |              |
|    | Action        |                 |              |
|    |-------------->|                 |              |
|    |               | Validate        |              |
|    |               |--------+        |              |
|    |               |        |        |              |
|    |               |<-------+        |              |
|    |               | Broadcast       |              |
|    |               |---------------->|              |
|    |               |                 |              |
|    |<--------------|-----------------|              |
|    | State Update  | State Update    |              |
|    |               |                 |              |
+-----------------------------------------------------+
```

**Game State Processing Flow**:

1. **Client Action**: Player initiates game action (e.g., play card)
2. **Server Validation**: Server validates action against game rules
3. **State Mutation**: Game engine updates the canonical state
4. **Broadcast**: All players receive state updates
5. **Client Rendering**: UI reflects the new game state

### WebSocket Event Types

| Event Type | Direction | Purpose | Payload Example |
|------------|-----------|---------|-----------------|
| `auth` | Client → Server | Authenticate session | `{token: "jwt..."}` |
| `join_game` | Client → Server | Enter matchmaking | `{format: "standard"}` |
| `game_found` | Server → Client | Match created | `{gameId: "123", opponent: "User"}` |
| `play_card` | Client → Server | Play card from hand | `{cardId: "abc", targets: ["xyz"]}` |
| `phase_change` | Server → Client | Turn phase updated | `{phase: "COMBAT", activePlayer: "1"}` |
| `stack_update` | Server → Client | Spell stack changed | `{stack: [{id: "spell1", ...}]}` |
| `game_error` | Server → Client | Invalid action | `{code: "INVALID_TARGET", message: "..."}` |

### State Consistency Mechanisms

1. **Authoritative Server**: Server holds canonical game state
2. **Transaction IDs**: Each action has a unique ID for tracking
3. **State Versioning**: Clients confirm state version
4. **Conflict Resolution**: Server resolves disagreements
5. **Replay Capability**: Actions can be replayed for debugging

## Database Schema

### Core Database Tables

```
+------------------+       +--------------------+
| users            |       | cards              |
+------------------+       +--------------------+
| id (PK)          |       | id (PK)            |
| username         |       | name               |
| email            |       | cost               |
| password_hash    |       | type               |
| created_at       |       | subtype            |
| last_login       |       | rarity             |
| settings_json    |       | rules_text         |
+--------+---------+       | power              |
         |                 | toughness          |
         |                 | image_url          |
         v                 | set_id (FK)        |
+--------+---------+       +----------+---------+
| player_stats     |                 |
+------------------+                 |
| user_id (FK)     |                 |
| games_played     |                 |
| wins             |                 v
| losses           |       +----------+---------+
| rank_points      |       | sets               |
| rank_tier        |       +--------------------+
+------------------+       | id (PK)            |
                           | name               |
                           | release_date       |
                           | is_active          |
                           +--------------------+
```

```
+------------------+       +--------------------+
| decks            |       | matches            |
+------------------+       +--------------------+
| id (PK)          |       | id (PK)            |
| user_id (FK)     |       | format             |
| name             |       | start_time         |
| format           |       | end_time           |
| created_at       |       | winner_id (FK)     |
| modified_at      |       | game_data_json     |
+--------+---------+       +----------+---------+
         |                            |
         v                            |
+--------+---------+                  |
| deck_cards       |                  |
+------------------+                  v
| deck_id (FK)     |       +----------+---------+
| card_id (FK)     |       | match_players      |
| quantity         |       +--------------------+
+------------------+       | match_id (FK)      |
                           | user_id (FK)       |
                           | deck_id (FK)       |
                           | final_life         |
                           | mulligan_count     |
                           +--------------------+
```

### Key Data Models

**Card Data Model**:
```typescript
interface Card {
  id: string;
  name: string;
  cost: {
    generic: number;
    red?: number;
    blue?: number;
    green?: number;
    black?: number;
    white?: number;
  };
  type: 'Creature' | 'Spell' | 'Enchantment' | 'Resource';
  subtype?: string[];
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Mythic' | 'Legendary';
  rules_text: string;
  flavor_text?: string;
  power?: number;
  toughness?: number;
  abilities: string[];
  set_id: string;
  artist: string;
  image_url: string;
}
```

**Game State Model**:
```typescript
interface GameState {
  game_id: string;
  turn_number: number;
  active_player_id: string;
  phase: 'BEGIN' | 'MAIN' | 'COMBAT' | 'END';
  players: {
    [player_id: string]: {
      life: number;
      energy: number;
      poison: number;
      hand: Card[];
      battlefield: {
        creatures: Card[];
        resources: Card[];
        enchantments: Card[];
      };
      graveyard: Card[];
      exile: Card[];
      deck_count: number;
    }
  };
  stack: StackItem[];
  current_priority: string; // player_id
  game_log: LogEntry[];
}
```

## Service Architecture

The overall system architecture follows a microservices pattern for scalability:

```
                     +----------------------------------+
                     |                                  |
                     |         LOAD BALANCER           |
                     |        (NGINX/HAProxy)          |
                     |                                  |
                     +--+------+------+------+------+--+
                        |      |      |      |      |
                        |      |      |      |      |
+-------+  +------------v-+  +-v------v-+  +-v------v-+  +------------+
|       |  |              |  |          |  |          |  |            |
| CDN   <--+ API GATEWAY  <--+ GAME     <--+ MATCHMAKER<--+ AUTH      |
| ASSETS|  | (Express)    |  | ENGINE   |  | SERVICE  |  | SERVICE    |
|       |  |              |  |          |  |          |  |            |
+---+---+  +------------+-+  +----------+  +----+-----+  +-----+------+
    ^                    ^                       ^              ^
    |                    |                       |              |
    |      +-------------v---------+             |              |
    |      |                       |             |              |
    +------+ STATIC ASSET SERVER   |             |              |
           | (Card Images, UI)     |             |              |
           |                       |             |              |
           +-----------------------+             |              |
                                                 |              |
                    +-------------------------+  |              |
                    |                         |  |              |
                    | WEBSOCKET CLUSTER       <--+              |
                    | (Socket.io)             |                 |
                    |                         |                 |
                    +-----------+-------------+                 |
                                ^                               |
                                |                               |
              +-----------------v-----------------+             |
              |                                   |             |
              |            REDIS CLUSTER          <-------------+
              |       (Pub/Sub, Game State)       |
              |                                   |
              +---------------+-------------------+
                              ^
                              |
              +--------------+v------------------+
              |                                  |
              |           POSTGRESQL            |
              |   (Users, Cards, Matches)       |
              |                                  |
              +----------------------------------+
```

### Service Responsibilities

1. **API Gateway**: Entry point for REST requests
   - Authentication routing
   - Rate limiting
   - Request filtering

2. **Game Engine**: Core game logic
   - Rule enforcement
   - State transitions
   - Action validation

3. **Matchmaker**: Player pairing
   - Queue management
   - Skill-based matching
   - Session creation

4. **Auth Service**: Identity management
   - Login/registration
   - Token issuance
   - Permission control

5. **WebSocket Cluster**: Real-time communication
   - Game event broadcasting
   - Client synchronization
   - Presence tracking

## Debian Deployment Considerations

### Server Environment

This TCG will run best on a Debian-based Linux distribution, which offers an ideal balance of stability, security, and performance for our game servers.

#### Debian Advantages
- Stable package ecosystem
- Strong security update cadence
- Lower resource footprint
- Excellent community support
- Robust init system (systemd)

### Infrastructure Setup

**Base System Requirements (Per Node)**:
- Debian 12 "Bookworm" (minimal installation)
- 8 CPU cores (16 for high-load servers)
- 16GB RAM (32GB for database nodes)
- 100GB SSD (1TB for database primary)
- 1Gbps network connection

**Docker-Based Deployment**:

```bash
# Example Docker Compose for Debian deployment
version: '3.8'

services:
  api-gateway:
    image: badass-tcg/api-gateway:latest
    restart: always
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis-cluster
    depends_on:
      - redis-cluster
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"

  game-engine:
    image: badass-tcg/game-engine:latest
    restart: always
    deploy:
      replicas: 4
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis-cluster
      - DATABASE_URL=postgres://user:password@postgres:5432/badass_tcg
    depends_on:
      - redis-cluster
      - postgres
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"

  matchmaker:
    image: badass-tcg/matchmaker:latest
    restart: always
    deploy:
      replicas: 2
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis-cluster
    depends_on:
      - redis-cluster
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"

  auth-service:
    image: badass-tcg/auth:latest
    restart: always
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:password@postgres:5432/badass_tcg
      - JWT_SECRET=your-fucking-secret-key-here
      - TOKEN_EXPIRY=24h
    depends_on:
      - postgres
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"

  websocket-server:
    image: badass-tcg/websocket:latest
    restart: always
    deploy:
      replicas: 2
    ports:
      - "8081:8081"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis-cluster
      - AUTH_SERVICE_URL=http://auth-service:3000
    depends_on:
      - redis-cluster
      - auth-service
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"

  static-assets:
    image: nginx:latest
    restart: always
    volumes:
      - ./assets:/usr/share/nginx/html
      - ./nginx/assets.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "8082:80"

  redis-cluster:
    image: redis:7.0-alpine
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=badass_tcg
    volumes:
      - pg-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d badass_tcg"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:latest
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/sites:/etc/nginx/conf.d
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - api-gateway
      - websocket-server
      - static-assets
    command: "/bin/sh -c 'while :; do sleep 6h & wait $${!}; nginx -s reload; done & nginx -g \"daemon off;\"'"

  certbot:
    image: certbot/certbot
    restart: always
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  redis-data:
  pg-data:
```

### Systemd Service Definitions

For non-containerized deployments or container management, use systemd service definitions:

```bash
# /etc/systemd/system/badass-tcg-api.service
[Unit]
Description=Badass TCG API Gateway
After=network.target

[Service]
User=tcg
WorkingDirectory=/opt/badass-tcg/api
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=badass-tcg-api
Environment=NODE_ENV=production
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
```

```bash
# /etc/systemd/system/badass-tcg-game.service
[Unit]
Description=Badass TCG Game Engine
After=network.target

[Service]
User=tcg
WorkingDirectory=/opt/badass-tcg/game-engine
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=badass-tcg-game
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

To control services on Debian:

```bash
# Enable services to start on boot
sudo systemctl enable badass-tcg-api.service
sudo systemctl enable badass-tcg-game.service

# Start services
sudo systemctl start badass-tcg-api.service
sudo systemctl start badass-tcg-game.service

# Check status
sudo systemctl status badass-tcg-api.service
```

## Final Deployment Checklist

### Pre-Deployment Validation

- [ ] Database schema migration scripts tested
- [ ] Docker images built and pushed to registry
- [ ] Environment configurations verified
- [ ] SSL certificates acquired and configured
- [ ] DNS records updated
- [ ] Firewall rules configured
- [ ] Secrets management verified
- [ ] Load balancer health checks tested

### Deployment Sequence

1. **Database Deployment**
   - Deploy PostgreSQL cluster
   - Run schema migrations
   - Load initial card data

2. **Cache Layer**
   - Deploy Redis cluster
   - Configure persistence settings
   - Set up monitoring

3. **Service Deployment**
   - Deploy Auth Service
   - Deploy Game Engine
   - Deploy Matchmaker
   - Deploy WebSocket Server
   - Deploy API Gateway

4. **Frontend Deployment**
   - Deploy Static Asset Server
   - Configure CDN integration
   - Deploy NGINX load balancer

### Post-Deployment Verification

- [ ] Health check endpoints responding
- [ ] All services registered with discovery
- [ ] Logs streaming to monitoring solution
- [ ] API endpoints accessible
- [ ] WebSocket connections functional
- [ ] Test game session creation
- [ ] Test card play and game mechanics
- [ ] Verify scaling behavior under load

## Monitoring and Observability

### Prometheus & Grafana Setup

```yaml
# /etc/prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'badass-tcg-api'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['api-gateway:8080']

  - job_name: 'badass-tcg-game'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['game-engine:8080']
      
  - job_name: 'badass-tcg-ws'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['websocket-server:8081']
      
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

### Key Metrics to Track

1. **System Metrics**
   - CPU/Memory usage
   - Disk I/O
   - Network traffic

2. **Application Metrics**
   - Request latency (95th percentile)
   - Error rates
   - Active game sessions
   - Concurrent users
   - Matchmaking queue length
   - WebSocket connection count

3. **Business Metrics**
   - Games started/completed
   - User registration rate
   - Deck creation rate
   - Card play frequency (for balance)

### Log Aggregation

Implement ELK stack (Elasticsearch, Logstash, Kibana) or Loki with Grafana for centralized logging:

```bash
# Filebeat configuration for Node.js applications
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/badass-tcg/*.log
  json.keys_under_root: true
  json.add_error_key: true
  
output.elasticsearch:
  hosts: ["elasticsearch:9200"]
```

## Security Hardening for Debian

### Base System Hardening

```bash
# Update system packages
apt update && apt upgrade -y

# Install security essentials
apt install -y ufw fail2ban unattended-upgrades 

# Configure automatic updates
dpkg-reconfigure -plow unattended-upgrades

# Set up firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp
ufw allow 8081/tcp
ufw enable

# Configure fail2ban
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
# Edit jail.local to customize settings
```

### SSH Hardening

Edit `/etc/ssh/sshd_config`:

```
PermitRootLogin no
PasswordAuthentication no
X11Forwarding no
MaxAuthTries 3
Protocol 2
```

### Container Security

1. **Root-less Containers**
   - Run containers as non-root users
   - Add user namespaces

2. **Image Security**
   - Use minimal base images (Alpine)
   - Regularly update images
   - Scan for vulnerabilities

3. **Runtime Security**
   - Apply seccomp profiles
   - Limit capabilities
   - Use read-only filesystems where possible

### Application Security

1. **Rate Limiting**
   - Implement at API Gateway
   - Per-user and per-IP limits

2. **Input Validation**
   - Validate all client-sent data
   - Sanitize database inputs

3. **Authentication/Authorization**
   - Short-lived JWT tokens
   - Proper scope validation
   - Secure cookie handling

4. **Secrets Management**
   - Use environment variables
   - Consider Hashicorp Vault for production
   - No secrets in Docker images or Git

## Scaling Considerations

### Horizontal Scaling

Components that should scale horizontally:
- Game Engine Instances
- WebSocket Servers
- API Gateway

### Vertical Scaling

Components that benefit from vertical scaling:
- Database Primary Node
- Redis Primary Node

### Auto-Scaling Policy

```yaml
# Example Kubernetes HPA configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: game-engine-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: game-engine
  minReplicas: 4
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

*Cross-references:*
- For details on game mechanics these systems must implement, see [Game Mechanics](1_game_mechanics.md)
- For card data structures that need database support, see [Deck Building & Card System](2_deck_building.md)
- For UI implementation that connects to this backend, see [UI Design Specification](3_ui_design.md)

