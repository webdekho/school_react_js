#!/bin/bash

# School Management System - Deployment Script
# This script automates the deployment process for the School Management System

set -e  # Exit on any error

echo "🚀 Starting School Management System Deployment..."

# Configuration
PROJECT_NAME="School Management System"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
DB_NAME="school_management"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists php; then
    print_error "PHP is not installed or not in PATH"
    exit 1
fi

if ! command_exists mysql; then
    print_error "MySQL is not installed or not in PATH"
    exit 1
fi

if ! command_exists node; then
    print_error "Node.js is not installed or not in PATH"
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed or not in PATH"
    exit 1
fi

print_success "All prerequisites are available"

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    
    if [ -f "database_schema.sql" ]; then
        print_status "Found database schema file"
        
        # Check if database exists
        if mysql -u root -e "USE $DB_NAME;" 2>/dev/null; then
            print_warning "Database '$DB_NAME' already exists"
            read -p "Do you want to recreate it? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                mysql -u root -e "DROP DATABASE IF EXISTS $DB_NAME;"
                mysql -u root -e "CREATE DATABASE $DB_NAME;"
                print_status "Database recreated"
            else
                print_status "Using existing database"
            fi
        else
            mysql -u root -e "CREATE DATABASE $DB_NAME;"
            print_success "Database '$DB_NAME' created"
        fi
        
        # Import schema
        print_status "Importing database schema..."
        mysql -u root $DB_NAME < database_schema.sql
        
        # Import sample data if exists
        if [ -f "sample_data.sql" ]; then
            print_status "Importing sample data..."
            mysql -u root $DB_NAME < sample_data.sql
            print_success "Sample data imported"
        fi
        
        print_success "Database setup completed"
    else
        print_error "Database schema file not found!"
        exit 1
    fi
}

# Function to setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    if [ -d "$BACKEND_DIR" ]; then
        cd $BACKEND_DIR
        
        # Check if config files exist
        if [ ! -f "application/config/database.php" ]; then
            print_error "Backend database config not found!"
            cd ..
            exit 1
        fi
        
        # Set permissions
        print_status "Setting file permissions..."
        chmod -R 755 .
        chmod -R 777 application/logs 2>/dev/null || true
        
        # Check if .htaccess exists
        if [ ! -f ".htaccess" ]; then
            print_status "Creating .htaccess file..."
            cat > .htaccess << 'EOF'
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php/$1 [QSA,L]

# CORS headers
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
Header always set Access-Control-Max-Age "3600"

# Handle preflight requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ index.php [R=200,L]
EOF
        fi
        
        cd ..
        print_success "Backend setup completed"
    else
        print_error "Backend directory not found!"
        exit 1
    fi
}

# Function to setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    if [ -d "$FRONTEND_DIR" ]; then
        cd $FRONTEND_DIR
        
        # Install dependencies
        print_status "Installing frontend dependencies..."
        npm install --legacy-peer-deps
        
        # Check if .env file exists
        if [ ! -f ".env" ]; then
            if [ -f ".env.local.example" ]; then
                print_status "Creating .env file from example..."
                cp .env.local.example .env
            else
                print_status "Creating default .env file..."
                cat > .env << 'EOF'
REACT_APP_API_URL=http://localhost/School/backend
REACT_APP_NAME=School Management System
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development
EOF
            fi
        fi
        
        cd ..
        print_success "Frontend setup completed"
    else
        print_error "Frontend directory not found!"
        exit 1
    fi
}

# Function to build for production
build_production() {
    print_status "Building for production..."
    
    cd $FRONTEND_DIR
    
    # Build production version
    print_status "Creating production build..."
    npm run build
    
    cd ..
    print_success "Production build completed"
    print_status "Production files are in $FRONTEND_DIR/build/"
}

# Function to start development servers
start_development() {
    print_status "Starting development servers..."
    
    # Check if we can start the frontend dev server
    if [ -d "$FRONTEND_DIR" ]; then
        cd $FRONTEND_DIR
        print_success "Frontend development server can be started with: npm start"
        print_status "It will be available at: http://localhost:3000"
        cd ..
    fi
    
    print_status "Make sure your web server (Apache/Nginx) is running for the backend"
    print_status "Backend API should be available at: http://localhost/School/backend/"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Frontend tests
    if [ -d "$FRONTEND_DIR" ]; then
        cd $FRONTEND_DIR
        if [ -f "package.json" ] && grep -q '"test"' package.json; then
            print_status "Running frontend tests..."
            npm test -- --watchAll=false || print_warning "Some frontend tests failed"
        fi
        cd ..
    fi
    
    # Backend tests (if available)
    print_status "Backend tests can be added using PHPUnit"
}

# Function to display post-deployment information
show_deployment_info() {
    echo
    print_success "=== Deployment Completed Successfully! ==="
    echo
    print_status "📋 Next Steps:"
    echo "   1. Start your web server (Apache/Nginx/XAMPP)"
    echo "   2. Access the application:"
    echo "      - Frontend: http://localhost:3000 (development)"
    echo "      - Backend API: http://localhost/School/backend/"
    echo "      - Admin Panel: http://localhost:3000/admin"
    echo
    print_status "🔐 Default Login Credentials:"
    echo "   - Mobile: 9999999999"
    echo "   - Password: password123"
    echo "   - User Type: Admin"
    echo
    print_status "📁 Important Files:"
    echo "   - Database Config: backend/application/config/database.php"
    echo "   - Frontend Config: frontend/.env"
    echo "   - Production Build: frontend/build/"
    echo
    print_status "🔧 For Production Deployment:"
    echo "   1. Run: ./deploy.sh --production"
    echo "   2. Upload build/ folder to your web server"
    echo "   3. Configure your production database settings"
    echo "   4. Update .env.production with your server details"
    echo
}

# Main deployment function
main() {
    local PRODUCTION=false
    local SKIP_DB=false
    local SKIP_DEPS=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --production|-p)
                PRODUCTION=true
                shift
                ;;
            --skip-database)
                SKIP_DB=true
                shift
                ;;
            --skip-dependencies)
                SKIP_DEPS=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --production, -p      Build for production"
                echo "  --skip-database       Skip database setup"
                echo "  --skip-dependencies   Skip dependency installation"
                echo "  --help, -h           Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    echo "🎓 $PROJECT_NAME Deployment Script"
    echo "===================================="
    echo
    
    # Setup database
    if [ "$SKIP_DB" = false ]; then
        setup_database
    else
        print_warning "Skipping database setup"
    fi
    
    # Setup backend
    setup_backend
    
    # Setup frontend
    if [ "$SKIP_DEPS" = false ]; then
        setup_frontend
    else
        print_warning "Skipping dependency installation"
    fi
    
    # Build or start based on mode
    if [ "$PRODUCTION" = true ]; then
        build_production
        print_status "Production deployment ready!"
        print_status "Upload the contents of $FRONTEND_DIR/build/ to your web server"
    else
        start_development
        run_tests
    fi
    
    # Show final information
    show_deployment_info
}

# Run main function with all arguments
main "$@"