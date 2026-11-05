# 🛠️ Guide to Initial Local Compilation Using the Makefile Workspace

Follow this step-by-step sequence to perform your initial local compilation, clear code verification gates, and verify target binaries on your development machine [On Tue, October 20, 2026].

## Step 1: Initialize the Local Module Tree
Run the setup macro to download external dependencies (such as HashiCorp Raft, Google gRPC, and Cobra) and install mandatory code generation tools:

```bash
make setup
```

## Step 2: Execute Protobuf Compilation
Generate your strongly typed Go gRPC message structures from your centralized protocol buffers file:

```bash
make proto
```

Verify that `engine/proto/v1/cluster.pb.go` and `engine/proto/v1/cluster_grpc.pb.go` are successfully output.

## Step 3: Clear Linting and Unit Testing Gates
Validate syntactic correctness and run the asynchronous processing and concurrency worker tests:

```bash
make lint
make test
```

## Step 4: Run the Local Statically Linked Compilation
Trigger the core build command to emit a zero-dependency, statically linked application binary directly to your local workspace:

```bash
make build
```

## Step 5: Verify the Compiled Binary Output
Confirm that the binary file size is optimized, stripped of debugging symbols, and completely runnable within your terminal shell:

```bash
file ./bin/decoupler
./bin/decoupler --help
```
