#!/bin/bash

# Lightweight dependency verification for Lambda functions
# Usage: ./scripts/verify-lambda-deps.sh [lambda-dir]

set -e

LAMBDA_DIR="${1:-lambda}"

echo "🔍 Verifying Lambda dependencies in $LAMBDA_DIR..."

# Find all Lambda function directories with package.json
for func_dir in $(find "$LAMBDA_DIR" -name "package.json" -exec dirname {} \;); do
    echo ""
    echo "📦 Checking $func_dir..."

    # Check if package.json exists
    if [ ! -f "$func_dir/package.json" ]; then
        echo "❌ No package.json found"
        continue
    fi

    echo "   📋 Dependencies declared:"
    jq -r '.dependencies // {} | to_entries[] | "     \(.key): \(.value)"' "$func_dir/package.json" 2>/dev/null || echo "     (none or invalid JSON)"

    # Check if node_modules exists and has expected packages
    if [ -d "$func_dir/node_modules" ]; then
        echo "   ✅ node_modules exists"

        # Check specific dependencies from package.json
        if command -v jq >/dev/null 2>&1; then
            deps=$(jq -r '.dependencies // {} | keys[]' "$func_dir/package.json" 2>/dev/null)
            missing_deps=()

            for dep in $deps; do
                if [ ! -d "$func_dir/node_modules/$dep" ]; then
                    missing_deps+=("$dep")
                fi
            done

            if [ ${#missing_deps[@]} -eq 0 ]; then
                echo "   ✅ All dependencies installed"
            else
                echo "   ❌ Missing dependencies: ${missing_deps[*]}"
                echo "   💡 Run: cd $func_dir && npm install"
            fi
        fi
    else
        echo "   ❌ node_modules missing"
        echo "   💡 Run: cd $func_dir && npm install"
    fi

    # Check for any .mjs files that import packages
    if ls "$func_dir"/*.mjs >/dev/null 2>&1; then
        echo "   📄 Checking imports in .mjs files:"
        for mjs_file in "$func_dir"/*.mjs; do
            imports=$(grep -E "^import.*from ['\"]([^/].*)['\"]" "$mjs_file" 2>/dev/null | sed -E "s/.*from ['\"]([^'\"]*)['\"].*/\1/" | sort -u || true)
            if [ -n "$imports" ]; then
                echo "      $(basename "$mjs_file"): $imports"
            fi
        done
    fi
done

echo ""
echo "🔧 Quick fixes for common issues:"
echo "   • Missing uuid: cd lambda/profile-esm && npm install"
echo "   • Reinstall all: find lambda -name node_modules -exec rm -rf {} + && find lambda -name package.json -exec sh -c 'cd \$(dirname {}) && npm install' \;"
echo "   • Check CDK bundling: Ensure CDK properly includes node_modules in Lambda package"