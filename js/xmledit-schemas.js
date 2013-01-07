Schemas =  {
    quota: {
        className: "Quota",
        elements: {
            "Allow" : {
                name: "Allow",
                    attributes: {
                    count : {
                        type: "integer"
                    },
                    countRef: {
                        type: "string"
                    }
                }
            },
            "Interval": {
                name: "Interval",
                    attributes: {
                    ref: {
                        type: "string"
                    }
                },
                text: {
                    type: "integer",
                        restrictionsRange:  {
                        min: 1,
                            max: 100000
                    }
                }
            },
            "Distributed": {
                name: "Distributed",
                    text: {
                    type: "boolean"
                }
            },
            "Synchronous": {
                name: "Synchronous",
                    text: {
                    type: "boolean"
                }
            },
            "TimeUnit": {
                name: "TimeUnit",
                    attributes: {
                    ref: {
                        type: "string"
                    }
                },
                text: {
                    type: "string",
                        restrictionsEnum: [
                        "second",
                        "minute",
                        "hour",
                        "day",
                        "month"
                    ]
                }
            }
        }
    }
};