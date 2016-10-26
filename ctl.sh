#! /bin/sh
set -e

PROJECT_NAME=marketplace
TIMESTAMP=$(date +%s)

case $1 in
  import-db)
    read -p "reimport db from prod? (y/n): " -r
    echo
    if [[ $REPLY =~ ^y$ ]]
    then
      make fetch-db-dump
      make import-db-dump
    fi
  ;;
  chronos-build-production-jobs)
    rm -rf chronos/jobs
    kops chronos-build --cluster production -t chronos/template.json --app marketplace/worker -o chronos/jobs chronos/jobs.json
    kops chronos-build --cluster production -t chronos/template.json --vault-app marketplace/mysql-backup --image 274199647570.dkr.ecr.us-east-1.amazonaws.com/mysql-backup:0.0.2 -o chronos/jobs chronos/mysql-backup.json
    echo "run chronos/chronos.py import --cluster production chronos/jobs"
    echo "or make chronos-import-production-jobs"
  ;;
  run)
    rm -rf chronos/jobs
    kops chronos-build --cluster production -t chronos/template.json --app marketplace/worker -o chronos/jobs chronos/jobs.json
    kops chronos-build --cluster production -t chronos/template.json --vault-app marketplace/mysql-backup --image 274199647570.dkr.ecr.us-east-1.amazonaws.com/mysql-backup:0.0.2 -o chronos/jobs chronos/mysql-backup.json
    echo "run chronos/chronos.py import --cluster production chronos/jobs"
    echo "or make chronos-import-production-jobs"
  ;;
  *)
    echo "invalid command"
    exit 1
  ;;
esac
