
  module.exports = {
    someSidebar: [
    {
        "type": "category",
        "label": "Meta",
        "items": [
            "framework-introduction"
        ]
    },
    {
        "type": "category",
        "label": "Foundation",
        "items": [
            "package-core",
            {
                "type": "category",
                "label": "Database",
                "items": [
                    "package-mongo",
                    "package-sql"
                ]
            },
            {
                "type": "category",
                "label": "Security",
                "items": [
                    "package-security",
                    "package-security-mongo",
                    "package-password-bundle"
                ]
            },
            {
                "type": "category",
                "label": "GraphQL",
                "items": [
                    "package-graphql",
                    "package-apollo",
                    "package-apollo-security"
                ]
            },
            "package-queue",
            "package-http-server",
            "package-validator-bundle",
            "package-logger",
            "package-ejson",
            "package-emails",
            "package-terminal"
        ]
    },
    {
        "type": "doc",
        "label": "Nova",
        "id": "package-nova"
    },
    {
        "type": "category",
        "label": "X-Framework",
        "items": [
            "x-framework-introduction",
            {
                "type": "category",
                "label": "Server",
                "items": [
                    "package-x-bundle",
                    "package-x-cli",
                    "package-x-cron-bundle",
                    "package-x-password-bundle",
                    "package-x-s3-uploads",
                    "x-framework-conventions"
                ]
            },
            {
                "type": "category",
                "label": "UI",
                "items": [
                    "package-x-ui",
                    "package-x-ui-admin",
                    "package-smart"
                ]
            },
            "x-framework-deployment"
        ]
    }
]
  }
  