.PHONY: help install validate rebuild check clean-derived

help:
	@echo "pi-chart targets:"
	@echo "  install        install validator + rebuild deps"
	@echo "  validate       run scripts/validate.py against this chart"
	@echo "  rebuild        regenerate _derived/ views"
	@echo "  check          rebuild + validate"
	@echo "  clean-derived  remove everything under _derived/ (safe; regenerable)"

install:
	pip install -r scripts/requirements.txt

validate:
	python3 scripts/validate.py .

rebuild:
	python3 scripts/rebuild_derived.py .

check: rebuild validate

clean-derived:
	find _derived -type f ! -name README.md -delete
