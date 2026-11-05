# 🛠️ Step-by-Step Go Codebase Compilation Guide

Follow these steps in your terminal to verify that your local workspace passes all linting, formatting, security checks, and static binary builds:

---

### Step 1: Clean the Workspace and Fetch Tooling
Run the cleanup and setup targets to remove stale build artifacts and download the necessary tools (such as `protoc-gen-go`, `trivy`, and `helm-unittest`):

```bash
make clean
make setup
```

---

### Step 2: Regenerate Protobuf Stubs
Ensure your gRPC Go files are compiled from the latest protocol buffer definitions:

```bash
make proto
```

**Expected Output:**
The files `engine/proto/v1/cluster.pb.go` and `engine/proto/v1/cluster_grpc.pb.go` are created or updated.

---

### Step 3: Run Linters and Static Analysis
Verify that all source files conform to standard Go formatting and pass static analysis checks:

```bash
make lint
```

**Expected Output:**
Clean exit with no reported errors or formatting discrepancies.

---

### Step 4: Execute Security and Concurrency Test Suites
Run the inline regex data sanitizer tests followed by the concurrent synchronization and circuit breaker unit tests:

```bash
make test-security
make test
```

**Expected Output:**
```text
=== RUN TestZeroExfiltrationRegexSanitizer
--- PASS: TestZeroExfiltrationRegexSanitizer (0.01s)
=== RUN TestCircuitBreakerAsymmetricLag
--- PASS: TestCircuitBreakerAsymmetricLag (0.21s)
PASS
```

---

### Step 5: Compile the Statically Linked Binary
Compile the zero-dependency binary to the local `bin/` directory:

```bash
make build
```

Verify the output binary using the `file` command:

```bash
file bin/decoupler
# Expected: bin/decoupler: ELF 64-bit LSB executable, x86-64, statically linked, stripped
```

---

### Operational Validation Matrix

| Step | Target Command | Primary Objective | Verification Gate |
| :--- | :--- | :--- | :--- |
| **1. Tooling** | `make clean && make setup` | Purge stale artifacts & verify toolchain | Clean workspace & binaries installed |
| **2. Protobuf** | `make proto` | Recompile gRPC protobuf service definitions | Zero stub drift in `engine/proto/v1` |
| **3. Linting** | `make lint` | Enforce formatting and static analysis | Clean exit code `0` |
| **4. Testing** | `make test-security && make test` | Execute security sanitizer & concurrency tests | Zero exfiltration, lag within sub-20ms budget |
| **5. Build** | `make build` | Output statically linked distroless ELF binary | ELF 64-bit statically linked, stripped |
