#!/bin/sh -e
set -x

ruff check src scripts --fix
ruff format src scripts
