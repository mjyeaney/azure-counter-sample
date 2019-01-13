#!/bin/bash

# script variables
location=eastus
resource_group_name=SampleCounterRG
appservice_plan_name=SampleCounterAppPlan
appservice_plan_size=B1
webapp_name=SampleCounterApp

# Create the app service plan, web app, and default NODEJS version
az group create -n $resource_group_name -l $location
az appservice plan create -n $appservice_plan_name -g $resource_group_name -l $location --sku $appservice_plan_size
az webapp create -n $webapp_name -g $resource_group_name --plan $appservice_plan_name
az webapp config appsettings set -g $resource_group_name -n $webapp_name --settings WEBSITE_NODE_DEFAULT_VERSION=10.6.0