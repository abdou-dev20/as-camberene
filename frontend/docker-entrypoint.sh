#!/bin/sh
set -eu

api_origin="${API_ORIGIN:-http://api:4100}"

sed "s|__API_ORIGIN__|${api_origin}|g" \
  /usr/local/apache2/conf/extra/asc-site.conf.template \
  > /usr/local/apache2/conf/extra/asc-site.conf

exec "$@"
