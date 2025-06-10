# FLAI API Test Suite

This directory contains comprehensive tests for all FLAI API endpoints.

## 🧪 Test Structure

```
tests/
├── __init__.py              # Package initialization
├── conftest.py              # Pytest configuration and fixtures
├── pytest.ini              # Pytest settings
├── requirements.txt         # Test dependencies
├── test_health.py           # Health endpoint tests
├── test_users.py           # User management API tests
├── test_pinterest.py        # Pinterest analysis API tests
├── reports/                 # Generated test reports
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- API server must be running on `http://localhost:8000`
- Virtual environment activated
- Test dependencies installed

### Install Test Dependencies
```bash
source venv/bin/activate
pip install -r tests/requirements.txt
```

### Run All Tests
```bash
# Using the test runner script
python run_tests.py

# Or using pytest directly
python -m pytest tests/
```

## 📊 Test Categories

### 1. Health Tests (`test_health.py`)
- ✅ Health endpoint availability
- ✅ Response time validation
- ✅ Response format validation

### 2. User API Tests (`test_users.py`)

#### Username Availability
- ✅ Check available username
- ✅ Check taken username  
- ✅ Case-insensitive checking

#### User Profile Management
- ✅ Create user profile (success)
- ✅ Create with minimal data
- ✅ Prevent duplicate profiles
- ✅ Prevent duplicate usernames
- ✅ Get user profile
- ✅ Update user profile
- ✅ Handle non-existent users

#### Onboarding
- ✅ Complete onboarding successfully
- ✅ Complete without Pinterest URL
- ✅ Handle non-existent users

#### Style Preferences
- ✅ Get empty preferences
- ✅ Handle non-existent users

### 3. Pinterest API Tests (`test_pinterest.py`)

#### Input Validation
- ✅ Invalid URL format
- ✅ Missing required fields
- ✅ Malformed JSON
- ✅ Non-Pinterest URLs

#### Pinterest Board Analysis
- ✅ Valid board analysis
- ✅ Non-existent board handling
- ✅ Response structure validation
- ✅ Timeout handling
- 🔄 Integration test with real boards

## 🛠️ Running Specific Test Categories

### Run Only Health Tests
```bash
python run_tests.py --type health
```

### Run Only User Tests
```bash
python run_tests.py --type users
```

### Run Only Pinterest Tests
```bash
python run_tests.py --type pinterest
```

### Run Unit Tests Only (exclude integration)
```bash
python run_tests.py --type unit
```

### Run Integration Tests Only
```bash
python run_tests.py --type integration
```

## 📈 Test Reports and Coverage

### Generate Coverage Report
```bash
python run_tests.py --coverage
```

### View Reports
- **HTML Test Report**: `tests/reports/report.html`
- **Coverage Report**: `tests/reports/coverage/index.html`

## 🔧 Advanced Usage

### Verbose Output
```bash
python run_tests.py --verbose
```

### Install Dependencies Automatically
```bash
python run_tests.py --install-deps
```

### Skip Server Check
```bash
python run_tests.py --skip-server-check
```

### Pytest Direct Commands

```bash
# Run with verbose output
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_users.py

# Run specific test function
python -m pytest tests/test_users.py::TestUserProfile::test_create_user_profile_success

# Run tests matching pattern
python -m pytest tests/ -k "username"

# Run tests with coverage
python -m pytest tests/ --cov=app --cov-report=html

# Run only integration tests
python -m pytest tests/ -m integration

# Run excluding integration tests
python -m pytest tests/ -m "not integration"
```

## 🧩 Writing New Tests

### Test File Naming
- Prefix with `test_`
- Descriptive names: `test_feature.py`

### Test Function Naming
- Prefix with `test_`
- Descriptive: `test_create_user_success`

### Test Class Naming
- Prefix with `Test`
- Group related tests: `TestUserProfile`

### Example Test
```python
def test_new_feature(api_base_url: str, headers: Dict[str, str]):
    """Test description"""
    response = requests.post(
        f"{api_base_url}/endpoint",
        headers=headers,
        json={"test": "data"}
    )
    
    assert response.status_code == 200
    assert response.json()["success"] is True
```

## 🏷️ Test Markers

Use markers to categorize tests:

```python
@pytest.mark.integration
def test_real_api_call():
    """Integration test that calls external APIs"""
    pass

@pytest.mark.slow
def test_long_running_operation():
    """Test that takes a long time to complete"""
    pass
```

## 📋 Test Checklist

Before pushing code, ensure:
- [ ] All existing tests pass
- [ ] New features have tests
- [ ] Edge cases are tested
- [ ] Error conditions are tested
- [ ] Documentation is updated
- [ ] Coverage is maintained 