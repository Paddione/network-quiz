#!/bin/bash
# Management script for Network Quiz Docker application

case "$1" in
  build)
    echo "Building Docker image..."
    docker-compose build
    ;;
  start)
    echo "Starting the application..."
    docker-compose up -d
    echo "Application started! Access at http://localhost:3000"
    ;;
  stop)
    echo "Stopping the application..."
    docker-compose down
    ;;
  restart)
    echo "Restarting the application..."
    docker-compose restart
    ;;
  logs)
    echo "Showing logs..."
    docker-compose logs -f
    ;;
  deploy)
    echo "Deploying new version..."
    git pull
    docker-compose down
    docker-compose build
    docker-compose up -d
    echo "Deployment complete!"
    ;;
  *)
    echo "Usage: $0 {build|start|stop|restart|logs|deploy}"
    exit 1
    ;;
esac

exit 0
