const PIECE_DICT = {
    "5*G": {
        "key": "5*G",
        "title": "General of the Army (Five Stars)",
        "eliminates": [
            "4*G",
            "3*G",
            "2*G",
            "1*G",
            "COL",
            "LTC",
            "MAJ",
            "CPT",
            "1LT",
            "2LT",
            "SGT",
            "PVT",
            "FLG"
        ]
    },
    "4*G": {
        "key": "4*G",
        "title": "General (Four Stars)",
        "eliminates": [
            "3*G",
            "2*G",
            "1*G",
            "COL",
            "LTC",
            "MAJ",
            "CPT",
            "1LT",
            "2LT",
            "SGT",
            "PVT",
            "FLG"
        ]
    },
    "3*G": {
        "key": "3*G",
        "title": "Lieutenant General (Three Stars)",
        "eliminates": [
            "2*G",
            "1*G",
            "COL",
            "LTC",
            "MAJ",
            "CPT",
            "1LT",
            "2LT",
            "SGT",
            "PVT",
            "FLG"
        ]
    },
    "2*G": {
        "key": "2*G",
        "title": "Major General (Two Stars)",
        "eliminates": [
            "1*G",
            "COL",
            "LTC",
            "MAJ",
            "CPT",
            "1LT",
            "2LT",
            "SGT",
            "PVT",
            "FLG"
        ]
    },
    "1*G": {
        "key": "1*G",
        "title": "Brigadier General (One Star)",
        "eliminates": [
            "COL",
            "LTC",
            "MAJ",
            "CPT",
            "1LT",
            "2LT",
            "SGT",
            "PVT",
            "FLG"
        ]
    },
    "COL": {
        "key": "COL",
        "title": "Colonel (Three Magdalo 7-Ray Suns)",
        "eliminates": [
            "LTC",
            "MAJ",
            "CPT",
            "1LT",
            "2LT",
            "SGT",
            "PVT",
            "FLG"
        ]
    },
    "LTC": {
        "key": "LTC",
        "title": "Lieutenant Colonel (Two Magdalo 7-Ray Suns)",
        "eliminates": [
            "MAJ",
            "CPT",
            "1LT",
            "2LT",
            "SGT",
            "PVT",
            "FLG"
        ]
    },
    "MAJ": {
        "key": "MAJ",
        "title": "Major (One Magdalo 7-Ray Sun)",
        "eliminates": [
            "CPT",
            "1LT",
            "2LT",
            "SGT",
            "PVT",
            "FLG"
        ]
    },
    "CPT": {
        "key": "CPT",
        "title": "Captain (Three Magdalo Triangles)",
        "eliminates": [
            "1LT",
            "2LT",
            "SGT",
            "PVT",
            "FLG"
        ]
    },
    "1LT": {
        "key": "1LT",
        "title": "1st Lieutenant (Two Magdalo Triangles)",
        "eliminates": [
            "2LT",
            "SGT",
            "PVT",
            "FLG"
        ]
    },
    "2LT": {
        "key": "2LT",
        "title": "2nd Lieutenant (One Magdalo Triangle)",
        "eliminates": [
            "SGT",
            "PVT",
            "FLG"
        ]
    },
    "SGT": {
        "key": "SGT",
        "title": "Sergeant (Three Chevrons)",
        "eliminates": [
            "PVT",
            "FLG"
        ]
    },
    "PVT": {
        "key": "PVT",
        "title": "Private (One Chevron)",
        "eliminates": [
            "SPY",
            "FLG"
        ]
    },
    "SPY": {
        "key": "SPY",
        "title": "Spy (Two Prying Eyes)",
        "eliminates": [
            "5*G",
            "4*G",
            "3*G",
            "2*G",
            "1*G",
            "COL",
            "LTC",
            "MAJ",
            "CPT",
            "1LT",
            "2LT",
            "SGT",
            "FLG"
        ]
    },
    "FLG": {
        "key": "FLG",
        "title": "Flag (Philippine Flag)",
        "eliminates": []
    }
}

const DEFAULTS = {
    player1: [
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        ["3*G", null, null, "PVT", "LTC", "5*G", "PVT", null, null],
        [null, "1LT", "SPY", "CPT", "SGT", "PVT", null, "4*G", "SPY"],
        ["2LT", "MAJ", "COL", "PVT", "PVT", "FLG", "1*G", "2*G", "PVT"]
    ],
    player2: [
        [null, null, null, "3*G", "FLG", "SGT", null, null, null],
        ["1*G", "2*G", "SPY", "LTC", "PVT", "1LT", "SPY", "CPT", "MAJ"],
        ["2LT", "PVT", "PVT", "4*G", "PVT", "5*G", "PVT", "PVT", "COL"],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null]
    ],
}

module.exports = {PIECE_DICT, DEFAULTS}