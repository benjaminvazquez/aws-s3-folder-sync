# AWS S3 Folder Sync

## Content

- [Pending features (Todo)](#todo)
- [Install](#install)
- [Use](#use)

## TODO:

- Implement watch for auto upload files when added
- Add package to the npm global repository
- Receive the credentials in CLI
- Create the bucket automatically if not exists
- Specify the name of the credential profile as a parameter

## Install

This tool needs a manual installation because it`is not a public package yet.

### Pre-requisites

- [Nodejs](https://nodejs.org/es/)
- Active AWS IAM Public and Private keys

### Clone Repository

```shell
    git clone https://github.com/benjaminvazquez/aws-s3-folder-sync.git
    cd aws-s3-folder-sync.git
```

### Install the package

```shell
    npm install -g
```

This command will install the package in the global environment, and will be available in all the system.

### Verify the installation

```shell
    s3synch --help
```

The help should be displayed

## Use

**Important use note**
- This program never collects, shares or sends to anybody the AWS credentials. Their use it's only to connect with the AWS SDK.
- The use and distribution of the aws credentials it's responsability of the user.
- It's recomended to create an exclusive AWS IAM user for this application with reduced permissions.