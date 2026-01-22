# Deployment Guide for Eskiz.uz (VPS)

To deploy your project on a VPS (Virtual Private Server) from Eskiz.uz, we will use **Docker** and **Docker Compose**. This is the most reliable method, ensuring that everything works exactly as it does in development.

## VPS Requirements

⚠️ **WARNING**: Due to the use of an AI model (CLIP for image search), the server requires a minimum of **4 GB of RAM**.
* **Recommended Plan**: Tarif-3 (4 Cores, 4 GB RAM) or higher.
* **OS**: Ubuntu 22.04 LTS (or 24.04).

---

## Step-by-Step Installation

### 1. Connect to the Server
Connect to your VPS via SSH (login details are sent to your email after purchase):
```bash
ssh root@your_ip_address
# Enter your password
```

### 2. Install Docker
Run the following commands one by one to install Docker:

```bash
# Update the system
apt update && apt upgrade -y

# Install necessary packages
apt install -y apt-transport-https ca-certificates curl software-properties-common git

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
docker compose version
```

### 3. Download the Project
There are two ways: via Git (recommended) or manual file upload.

#### Option A: Via Git (if you have a repository)
```bash
# Clone the repository
git clone https://github.com/your-username/your-repo.git gilamchi
cd gilamchi
```

#### Option B: Manual Upload (if no Git)
You can use FileZilla or SCP to copy the project folder to the server at `/root/gilamchi`.

### 4. Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.prod.example .env.prod
   ```

2. Edit the settings (MUST change passwords!):
   ```bash
   nano .env.prod
   ```
   * Change `POSTGRES_PASSWORD` to a strong password.
   * Change `SECRET_KEY` (generate a long random string).
   * Press `Ctrl+O`, `Enter` to save, and `Ctrl+X` to exit.

### 5. Launch (Deployment)

From the project folder:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This command will:
1. Download PostgreSQL.
2. Build the Backend (install Python, libraries, download CLIP model).
3. Build the Frontend (React build).
4. Run everything in the background.

The first build will take 5-10 minutes (CLIP and Torch are large).

### 6. Verification

Open your server's IP in a browser:
`http://your_ip_address`

If successful, you will see your application! 🎉

---

## Useful Commands

**View logs (if something isn't working):**
```bash
docker compose -f docker-compose.prod.yml logs -f
```

**Stop the server:**
```bash
docker compose -f docker-compose.prod.yml down
```

**Update project (after `git pull`):**
```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

**Backup database:**
```bash
docker compose -f docker-compose.prod.yml exec db pg_dump -U gilamchi_user gilamchi_db > backup.sql
```

## ⚡ Economy: Running on 1 GB RAM (Tarif-1)

If you want to use the cheapest plan (1 GB RAM), verify these steps, otherwise calls to the server will crash due to lack of memory for the AI model.

### 1. Create Swap (Virtual Memory) - MANDATORY
Immediately after your first login to the server, run these commands:

```bash
# Create a 4GB swap file
fallocate -l 4G /swapfile

# Set permissions
chmod 600 /swapfile

# Format as swap
mkswap /swapfile

# Enable swap
swapon /swapfile

# Make permanent (so it persists after reboot)
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Verify (you should see Swap: 4.0G)
free -h
```

### 2. Build Docker Images Locally (on your PC)
Building on a 1GB server will kill it. Build the app on your computer and push images to the server.

**On your computer:**
1. Create an account on [Docker Hub](https://hub.docker.com/) (free).
2. Log in to Docker Desktop.
3. Run these commands in your project folder:

```bash
# Login to Docker
docker login

# Build and push Backend
docker build -t your_username/gilamchi-backend:latest ./backend
docker push your_username/gilamchi-backend:latest

# Build and push Frontend
docker build -t your_username/gilamchi-frontend:latest ./frontend
docker push your_username/gilamchi-frontend:latest
```

### 3. Configure docker-compose.prod.yml on the Server
On the server, edit the `docker-compose.prod.yml` file to pull ready-made images instead of building them.

Replace the `build: ...` section with `image: ...`:

For backend:
```yaml
  backend:
    # build: 
    #   context: ./backend
    #   dockerfile: Dockerfile
    image: your_username/gilamchi-backend:latest  # <--- CHANGE THIS
    restart: always
    # ...
    environment:
      - WORKERS=1  # <--- IMPORTANT: Only 1 Python process
```

For frontend:
```yaml
  frontend:
    # build:
    #   context: ./frontend
    #   dockerfile: Dockerfile
    image: your_username/gilamchi-frontend:latest # <--- CHANGE THIS
```

### 4. Launch
```bash
docker compose -f docker-compose.prod.yml up -d
```

The server will run slower (due to Swap) but will be stable.

---

## Domain Setup (Optional)

If you have a domain (e.g., `gilamchi.uz`):

1. In your domain control panel, point the A record to your server's IP.
2. On the server, you can configure HTTPS using Nginx Proxy Manager or Certbot, but that is a separate task.

## Troubleshooting

**Problem: Server hangs during build**
Reason: Insufficient RAM.
Solution: Add a Swap file (Virtual Memory). See the "Economy" section above.
