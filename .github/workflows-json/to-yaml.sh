set -uC
cd ${0%/*}

yq -P -I 4 ${1} | head -c -1 | tee ../workflows/`basename ${1} .json`.yaml &> /dev/null