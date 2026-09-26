#!/usr/bin/env bash
# Regression test: a bare file argument must be analysed as that file,
# never silently replaced by stdin; unknown commands must fail loudly.
set -u
CLI="node $(dirname "$0")/../../dist/cli.js"
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
printf "In today's fast-paced landscape, we must delve into a robust, seamless, cutting-edge tapestry of synergy. Moreover, leveraging holistic paradigms will unlock transformative value.\n" > "$tmp/sloppy.txt"
fail=0
strip() { sed 's/\x1b\[[0-9;]*m//g'; }
want=$($CLI score "$tmp/sloppy.txt" | strip | awk '{print $1}')

got=$($CLI "$tmp/sloppy.txt" </dev/null | strip | grep -o 'Score: [0-9]*' | awk '{print $2}')
[ "$got" = "$want" ] && echo "PASS bare file, no stdin ($got)" || { echo "FAIL bare file, no stdin: got '$got' want '$want'"; fail=1; }

got=$(echo "Plain words here." | $CLI "$tmp/sloppy.txt" | strip | grep -o 'Score: [0-9]*' | awk '{print $2}')
[ "$got" = "$want" ] && echo "PASS bare file ignores piped stdin ($got)" || { echo "FAIL bare file with piped stdin: got '$got' want '$want'"; fail=1; }

$CLI no-such-file.md </dev/null >/dev/null 2>&1; rc=$?
[ "$rc" -ne 0 ] && echo "PASS unknown arg exits non-zero ($rc)" || { echo "FAIL unknown arg exited 0"; fail=1; }

got=$(cat "$tmp/sloppy.txt" | $CLI score | strip | awk '{print $1}')
[ "$got" = "$want" ] && echo "PASS pipe + score unchanged ($got)" || { echo "FAIL pipe + score: got '$got'"; fail=1; }
exit $fail
