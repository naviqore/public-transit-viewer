.DEFAULT_GOAL := run
.PHONY: setup clean install py-lint format run

PYTHON_VERSION = 3.12

REPOSITORY = public-transit-viewer

setup:
ifeq ($(OS),Windows_NT)
	@if not exist .python-version ( \
		@pyenv install -s $(PYTHON_VERSION) && \
		@pyenv local $(PYTHON_VERSION) && \
		@pip install poetry \
	)
else
	@if [ ! -f .python-version ]; then \
		pyenv install -s $(PYTHON_VERSION); \
		pyenv local $(PYTHON_VERSION); \
		pip install poetry; \
	fi
endif

	@poetry config virtualenvs.create true
	@poetry config virtualenvs.in-project true

ifeq ($(OS),Windows_NT)
	@for /f %%i in ('python -c "import sys; print(sys.executable)"') do @set PYTHON_PATH=%%i && poetry env use %%i && echo %%i
else
	@poetry env use $(shell python -c "import sys; print(sys.executable)")
endif

clean: setup ## rpemove all build, test, coverage and python artifacts
ifeq ($(OS),Windows_NT)
	@echo WINDOWS
	@poetry env info -p > temp2.txt
	@timeout /t 2
	@echo Checking for virtual environment
	@set /p PYTHON_PATH=<temp2.txt
	@poetry env remove %ENV_PATH%
	@del /F /Q temp2.txt
	@if exist .python-version del /F /Q .python-version
else
	rm -f .python-version
	@poetry env remove $(shell basename $(shell poetry env info -p))
endif

install: setup ## install dependencies
	poetry install --sync
	poetry run pre-commit install

format: install ## format package and test files using black
	poetry run black naviqore_viewer/

py-lint: install ## lint scripts and tests files using flake8
	poetry run flake8 naviqore_viewer/

run: install
	poetry run streamlit run naviqore_viewer/main.py
