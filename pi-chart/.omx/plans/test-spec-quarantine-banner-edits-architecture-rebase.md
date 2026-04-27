# Test spec — Quarantine banner edits for architecture rebase (QBN-001)

PRD: [`prd-quarantine-banner-edits-architecture-rebase.md`](prd-quarantine-banner-edits-architecture-rebase.md)
Status: proposed execution-ready, docs-only.

## Verification model

The banner lane may run in a worktree that already contains uncommitted planning/source-authority changes. Therefore verification must capture content baselines before edits and prove:

1. the six owned tracked files changed by adding exactly one banner paragraph after the H1 title;
2. non-owned tracked diff content did not change during execution;
3. pre-existing dirty non-owned paths, including untracked files/directories, are byte-identical by SHA manifest;
4. ignored `.draft` candidates stayed untouched;
5. no new non-owned/non-QBN-temp status line appears after baseline;

The ignored `.draft` files from the original plan are explicitly out of scope for QBN-001.

## Owned tracked file set

```text
memos/pi-chart-agent-canvas-plan-26042026.md
docs/design/pi-sim-vitals-write-contract.md
memos/pi-chart-vitals-connector-unblock-plan-26042026.md
docs/design/pi-agent-connector-contract.md
memos/pi-chart-boundary-adapter-definitive-synthesis.md
memos/definitive-fhir-boundary-pi-chart.md
```

## Required commands

### 1. Capture pre-execution content baseline and reject pre-existing forbidden changes

Run before applying banners:

```bash
mkdir -p .omx/tmp/qbn-001-owned-before

git status --porcelain=v1 --untracked-files=all -- . > .omx/tmp/qbn-001-pre-status.txt
git rev-parse --show-prefix > .omx/tmp/qbn-001-git-prefix.txt

git diff --binary -- . \
  ':(exclude)memos/pi-chart-agent-canvas-plan-26042026.md' \
  ':(exclude)docs/design/pi-sim-vitals-write-contract.md' \
  ':(exclude)memos/pi-chart-vitals-connector-unblock-plan-26042026.md' \
  ':(exclude)docs/design/pi-agent-connector-contract.md' \
  ':(exclude)memos/pi-chart-boundary-adapter-definitive-synthesis.md' \
  ':(exclude)memos/definitive-fhir-boundary-pi-chart.md' \
  > .omx/tmp/qbn-001-pre-non-owned-tracked.diff

python3 - <<'PY'
from pathlib import Path
import hashlib
import json
import re
import shutil

owned = {
  'memos/pi-chart-agent-canvas-plan-26042026.md',
  'docs/design/pi-sim-vitals-write-contract.md',
  'memos/pi-chart-vitals-connector-unblock-plan-26042026.md',
  'docs/design/pi-agent-connector-contract.md',
  'memos/pi-chart-boundary-adapter-definitive-synthesis.md',
  'memos/definitive-fhir-boundary-pi-chart.md',
}
draft = [
  'docs/plans/.draft/prd-a9b-product-implementation.md',
  'docs/plans/.draft/test-spec-a9b-product-implementation.md',
]
qbn_tmp = '.omx/tmp/qbn-001-'
for f in owned:
    src = Path(f)
    if not src.exists():
        raise SystemExit(f'Missing owned file: {f}')
    dst = Path('.omx/tmp/qbn-001-owned-before') / f
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dst)

def sha_file(path: Path) -> str | None:
    if not path.exists() or not path.is_file():
        return None
    return hashlib.sha256(path.read_bytes()).hexdigest()

Path('.omx/tmp/qbn-001-draft-hashes-before.json').write_text(json.dumps({f: sha_file(Path(f)) for f in draft}, indent=2) + '\n')

forbidden = re.compile(r'^(src|schemas|patients|scripts)/|^(package.json|package-lock.json|pnpm-lock.yaml|yarn.lock)$|^docs/prototypes/|^docs/design/.*\.html$')
pre_status = Path('.omx/tmp/qbn-001-pre-status.txt').read_text().splitlines()

prefix = Path('.omx/tmp/qbn-001-git-prefix.txt').read_text().strip()

def normalize_status_path(path: str) -> str:
    if prefix and path.startswith(prefix):
        return path[len(prefix):]
    return path

def status_paths(line: str) -> list[str]:
    raw = line[3:]
    return [normalize_status_path(p.strip()) for p in raw.split(' -> ')]

def expand_path(path: str) -> list[Path]:
    p = Path(path)
    if str(p).startswith(qbn_tmp):
        return []
    if path in owned:
        return []
    if p.is_dir():
        return sorted(x for x in p.rglob('*') if x.is_file() and not str(x).startswith(qbn_tmp))
    return [p]

dirty_manifest = {}
for line in pre_status:
    parts = status_paths(line)
    if any(forbidden.search(p) for p in parts):
        raise SystemExit(f'Pre-existing forbidden dirty path before QBN-001: {line}')
    for part in parts:
        for file_path in expand_path(part):
            key = file_path.as_posix()
            if key in owned or key.startswith(qbn_tmp):
                continue
            dirty_manifest[key] = sha_file(file_path)
Path('.omx/tmp/qbn-001-dirty-non-owned-before.json').write_text(json.dumps(dirty_manifest, indent=2, sort_keys=True) + '\n')
PY
```

### 2. After edits, prove owned file set changed and non-owned content did not

```bash
git status --porcelain=v1 --untracked-files=all -- . > .omx/tmp/qbn-001-post-status.txt

git diff --binary -- . \
  ':(exclude)memos/pi-chart-agent-canvas-plan-26042026.md' \
  ':(exclude)docs/design/pi-sim-vitals-write-contract.md' \
  ':(exclude)memos/pi-chart-vitals-connector-unblock-plan-26042026.md' \
  ':(exclude)docs/design/pi-agent-connector-contract.md' \
  ':(exclude)memos/pi-chart-boundary-adapter-definitive-synthesis.md' \
  ':(exclude)memos/definitive-fhir-boundary-pi-chart.md' \
  > .omx/tmp/qbn-001-post-non-owned-tracked.diff

cmp .omx/tmp/qbn-001-pre-non-owned-tracked.diff .omx/tmp/qbn-001-post-non-owned-tracked.diff

python3 - <<'PY'
from pathlib import Path
import hashlib
import json
import subprocess

owned = {
  'memos/pi-chart-agent-canvas-plan-26042026.md',
  'docs/design/pi-sim-vitals-write-contract.md',
  'memos/pi-chart-vitals-connector-unblock-plan-26042026.md',
  'docs/design/pi-agent-connector-contract.md',
  'memos/pi-chart-boundary-adapter-definitive-synthesis.md',
  'memos/definitive-fhir-boundary-pi-chart.md',
}
prefix = Path('.omx/tmp/qbn-001-git-prefix.txt').read_text().strip()
def normalize_git_path(path: str) -> str:
    if prefix and path.startswith(prefix):
        return path[len(prefix):]
    return path
changed_owned = {normalize_git_path(p) for p in subprocess.check_output(['git', 'diff', '--name-only', '--', *sorted(owned)], text=True).splitlines()}
if changed_owned != owned:
    raise SystemExit(f'Owned tracked diff mismatch: changed={sorted(changed_owned)} expected={sorted(owned)}')

before = json.loads(Path('.omx/tmp/qbn-001-draft-hashes-before.json').read_text())
def sha(path: str) -> str | None:
    p = Path(path)
    if not p.exists() or not p.is_file():
        return None
    return hashlib.sha256(p.read_bytes()).hexdigest()
after = {f: sha(f) for f in before}
if after != before:
    raise SystemExit(f'Ignored .draft files changed: before={before} after={after}')

dirty_before = json.loads(Path('.omx/tmp/qbn-001-dirty-non-owned-before.json').read_text())
owned = {
  'memos/pi-chart-agent-canvas-plan-26042026.md',
  'docs/design/pi-sim-vitals-write-contract.md',
  'memos/pi-chart-vitals-connector-unblock-plan-26042026.md',
  'docs/design/pi-agent-connector-contract.md',
  'memos/pi-chart-boundary-adapter-definitive-synthesis.md',
  'memos/definitive-fhir-boundary-pi-chart.md',
}
qbn_tmp = '.omx/tmp/qbn-001-'
def expand_path(path: str) -> list[Path]:
    p = Path(path)
    if str(p).startswith(qbn_tmp) or path in owned:
        return []
    if p.is_dir():
        return sorted(x for x in p.rglob('*') if x.is_file() and not str(x).startswith(qbn_tmp))
    return [p]
prefix = Path('.omx/tmp/qbn-001-git-prefix.txt').read_text().strip()

def normalize_status_path(path: str) -> str:
    if prefix and path.startswith(prefix):
        return path[len(prefix):]
    return path

def status_paths(line: str) -> list[str]:
    return [normalize_status_path(p.strip()) for p in line[3:].split(' -> ')]
dirty_after = {}
for line in Path('.omx/tmp/qbn-001-pre-status.txt').read_text().splitlines():
    for part in status_paths(line):
        for file_path in expand_path(part):
            key = file_path.as_posix()
            if key in owned or key.startswith(qbn_tmp):
                continue
            dirty_after[key] = sha(key)
if dirty_after != dirty_before:
    raise SystemExit(f'Pre-existing dirty non-owned paths changed: before={dirty_before} after={dirty_after}')
PY
```

### 3. Prove each owned edit is H1 + one banner paragraph + exact previous body

```bash
python3 - <<'PY'
from pathlib import Path

expected = {
  'memos/pi-chart-agent-canvas-plan-26042026.md': '> **Status:** Prototype/directional evidence only. Not current architectural authority and not implementation authorization. For current direction, see ADR 018, `ARCHITECTURE.md`, and `docs/architecture/source-authority.md`.',
  'docs/design/pi-sim-vitals-write-contract.md': '> **Status:** Draft connector/prototype artifact. Not current implementation authority for endpoints, storage, or pi-sim adapters. For current direction, see ADR 018 and `docs/architecture/source-authority.md`; require a later approved PRD/ADR before implementing ingest behavior.',
  'memos/pi-chart-vitals-connector-unblock-plan-26042026.md': '> **Status:** Historical/proposal-only planning memo. Not current implementation authorization for vitals ingest, `chart_state`, source edits, or pi-sim coupling. For current direction, see ADR 018, `docs/architecture/source-authority.md`, and a later approved adapter/ingest PRD if one exists.',
  'docs/design/pi-agent-connector-contract.md': '> **Status:** Prototype/directional connector sketch. Not current API, tool, or architecture authority. For current direction, see ADR 018, `ARCHITECTURE.md`, and `docs/architecture/source-authority.md`; promote any connector contract through a later PRD/ADR before implementation.',
  'memos/pi-chart-boundary-adapter-definitive-synthesis.md': '> **Status:** Historical/proposal-only memo. Not current adapter implementation authority. Treat as boundary-design evidence only; promote specific claims through an accepted ADR or approved PRD/test-spec before editing `src/**`, schemas, or adapter docs.',
  'memos/definitive-fhir-boundary-pi-chart.md': '> **Status:** Historical/proposal-only memo. Not current FHIR adapter implementation authority. Use as boundary-design evidence only; for current authority, see ADR 018, `docs/architecture/source-authority.md`, and any later accepted adapter ADR/PRD.',
}
base = Path('.omx/tmp/qbn-001-owned-before')
for f, banner in expected.items():
    before = (base / f).read_text().splitlines()
    after = Path(f).read_text().splitlines()
    if len(before) < 1 or not before[0].startswith('# '):
        raise SystemExit(f'Unexpected pre-edit title: {f}')
    expected_after = [before[0], '', banner, '', *before[1:]]
    if after != expected_after:
        raise SystemExit(f'Edit is not exactly H1 + banner + previous body: {f}')
PY
```

### 4. Post-status guard: only owned banner modifications may be new

```bash
python3 - <<'PY'
from pathlib import Path

pre = set(Path('.omx/tmp/qbn-001-pre-status.txt').read_text().splitlines())
post = set(Path('.omx/tmp/qbn-001-post-status.txt').read_text().splitlines())
new_lines = post - pre
owned = {
  'memos/pi-chart-agent-canvas-plan-26042026.md',
  'docs/design/pi-sim-vitals-write-contract.md',
  'memos/pi-chart-vitals-connector-unblock-plan-26042026.md',
  'docs/design/pi-agent-connector-contract.md',
  'memos/pi-chart-boundary-adapter-definitive-synthesis.md',
  'memos/definitive-fhir-boundary-pi-chart.md',
}
qbn_tmp_prefix = '.omx/tmp/qbn-001-'
allowed_new = {f' M {path}' for path in owned}

prefix = Path('.omx/tmp/qbn-001-git-prefix.txt').read_text().strip()

def normalize_status_path(path: str) -> str:
    if prefix and path.startswith(prefix):
        return path[len(prefix):]
    return path

def normalize_status_line(line: str) -> str:
    code = line[:3]
    raw = line[3:]
    return code + ' -> '.join(normalize_status_path(p.strip()) for p in raw.split(' -> '))

def status_paths(line: str) -> list[str]:
    return [normalize_status_path(p.strip()) for p in line[3:].split(' -> ')]

for raw_line in sorted(new_lines):
    line = normalize_status_line(raw_line)
    if line in allowed_new:
        continue
    # QBN temp files are permitted because the test spec itself creates them.
    if all(path.startswith(qbn_tmp_prefix) for path in status_paths(line)):
        continue
    raise SystemExit(f'Unexpected new non-owned status line after QBN-001 baseline: {line}')
PY
```

### 5. No delete/move guard for owned files

```bash
if git diff --name-status -- memos/pi-chart-agent-canvas-plan-26042026.md \
  docs/design/pi-sim-vitals-write-contract.md \
  memos/pi-chart-vitals-connector-unblock-plan-26042026.md \
  docs/design/pi-agent-connector-contract.md \
  memos/pi-chart-boundary-adapter-definitive-synthesis.md \
  memos/definitive-fhir-boundary-pi-chart.md | awk '$1 ~ /^[DR]/ {print; found=1} END{exit found?0:1}'; then
  echo 'Unexpected deletion/rename in banner lane'
  exit 1
fi
```

### 6. Runtime regression evidence

```bash
npm test
npm run validate -- --patient patient_001
npm run validate -- --patient patient_002
```

## Pass criteria

- All six tracked files have exactly the expected banner insertion.
- Non-owned tracked diff content is unchanged from baseline.
- Pre-existing dirty non-owned paths are hash-identical before/after.
- Ignored `.draft` files are hash-identical before/after.
- Post-status and delete/move guards pass.
- Runtime tests/validations pass, or any failure is proven pre-existing and unrelated to banner-only docs changes.
