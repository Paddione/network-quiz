# Network Quiz Game - Docker Setup

This is a containerized version of the Network Quiz multiplayer game.

## Usage Instructions

### First-time Setup
```bash
# Build the Docker image
./manage.sh build
```

### Starting the Application
```bash
# Start the application
./manage.sh start
```

### Managing the Application
```bash
# View logs
./manage.sh logs

# Stop the application
./manage.sh stop

# Restart the application
./manage.sh restart

# Deploy updates
./manage.sh deploy
```

### Access the Game
Once started, the game is available at:
- http://localhost:3000

### Making it Accessible to Others
1. Find your server's IP address:
   ```bash
   ip addr show
   ```

2. Make sure port 3000 is open in your firewall:
   ```bash
   sudo ufw allow 3000/tcp
   ```

3. Other players can connect using: http://YOUR_SERVER_IP:3000

### Using a Domain Name
If you have a domain, you can set up Nginx as a reverse proxy:

```bash
sudo apt install nginx
```

Create a config file:
```bash
sudo nano /etc/nginx/sites-available/quiz-game
```

Add:
```
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/quiz-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Modifying the Game
The game files are located in:
- HTML, CSS, JavaScript: `./public/`
- Server code: `./server.js`
- Quiz data: `./public/quizData.js`

After making changes, restart the application:
```bash
./manage.sh restart
```
