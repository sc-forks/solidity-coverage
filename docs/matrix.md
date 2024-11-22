### Test Matrix Example

An example of output written to the file `./testMatrix.json` when coverage
is run with the `--matrix` cli flag. (Source project: [sc-forks/hardhat-e2e][1])

[1]: https://github.com/sc-forks/hardhat-e2e


```js
// Paths are relative to the project root directory
{
 // Solidity file name
 "contracts/EtherRouter/EtherRouter.sol": {

  // Line number
  "23": [
   {
    // Grep-able mocha test title
    "title": "Resolves methods routed through an EtherRouter proxy",

    // Selectable mocha test file
    "file": "test/etherrouter.js"
   }
  ],
  "42": [
   {
    "title": "Resolves methods routed through an EtherRouter proxy",
    "file": "test/etherrouter.js"
   }
  ],
  "45": [
   {
    "title": "Resolves methods routed through an EtherRouter proxy",
    "file": "test/etherrouter.js"
   }
  ],
  "61": [
   {
    "title": "Resolves methods routed through an EtherRouter proxy",
    "file": "test/etherrouter.js"
   }
  ]
 },
 "contracts/EtherRouter/Factory.sol": {
  "19": [
   {
    "title": "Resolves methods routed through an EtherRouter proxy",
    "file": "test/etherrouter.js"
   }
  ]
 },
 "contracts/EtherRouter/Resolver.sol": {
  "22": [
   {
    "title": "Resolves methods routed through an EtherRouter proxy",
    "file": "test/etherrouter.js"
   }
  ],
  "26": [
   {
    "title": "Resolves methods routed through an EtherRouter proxy",
    "file": "test/etherrouter.js"
   }
  ],
  "30": [
   {
    "title": "Resolves methods routed through an EtherRouter proxy",
    "file": "test/etherrouter.js"
   }
  ]
 },
 "contracts/MetaCoin.sol": {
  "16": [
   {
    "title": "should put 10000 MetaCoin in the first account",
    "file": "test/metacoin.js"
   },
   {
    "title": "should call a function that depends on a linked library",
    "file": "test/metacoin.js"
   },
   {
    "title": "should send coin correctly",
    "file": "test/metacoin.js"
   },
   {
    "title": "a and b",
    "file": "test/multicontract.js"
   }
  ],
  "20": [
   {
    "title": "should send coin correctly",
    "file": "test/metacoin.js"
   }
  ],
  "21": [
   {
    "title": "should send coin correctly",
    "file": "test/metacoin.js"
   }
  ],
  "22": [
   {
    "title": "should send coin correctly",
    "file": "test/metacoin.js"
   }
  ],
  "23": [
   {
    "title": "should send coin correctly",
    "file": "test/metacoin.js"
   }
  ],
  "24": [
   {
    "title": "should send coin correctly",
    "file": "test/metacoin.js"
   }
  ],
  "28": [
   {
    "title": "should call a function that depends on a linked library",
    "file": "test/metacoin.js"
   }
  ],
  "32": [
   {
    "title": "should put 10000 MetaCoin in the first account",
    "file": "test/metacoin.js"
   },
   {
    "title": "should call a function that depends on a linked library",
    "file": "test/metacoin.js"
   },
   {
    "title": "should send coin correctly",
    "file": "test/metacoin.js"
   }
  ]
 },
 "contracts/ConvertLib.sol": {
  "6": [
   {
    "title": "should call a function that depends on a linked library",
    "file": "test/metacoin.js"
   }
  ]
 },
 "contracts/MultiContractFile.sol": {
  "7": [
   {
    "title": "a and b",
    "file": "test/multicontract.js"
   },
   {
    "title": "methods that call methods in other contracts",
    "file": "test/variablecosts.js"
   }
  ],
  "15": [
   {
    "title": "a and b",
    "file": "test/multicontract.js"
   }
  ]
 },
 "contracts/VariableConstructor.sol": {
  "8": [
   {
    "title": "should initialize with a short string",
    "file": "test/variableconstructor.js"
   },
   {
    "title": "should initialize with a medium length string",
    "file": "test/variableconstructor.js"
   },
   {
    "title": "should initialize with a long string",
    "file": "test/variableconstructor.js"
   },
   {
    "title": "should initialize with a random length string",
    "file": "test/variableconstructor.js"
   }
  ]
 },
 "contracts/VariableCosts.sol": {
  "13": [
   {
    "title": "should initialize with a short string",
    "file": "test/variableconstructor.js"
   },
   {
    "title": "should initialize with a medium length string",
    "file": "test/variableconstructor.js"
   },
   {
    "title": "should initialize with a long string",
    "file": "test/variableconstructor.js"
   },
   {
    "title": "should initialize with a random length string",
    "file": "test/variableconstructor.js"
   },
   {
    "title": "should add one",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should add three",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should add even 5!",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should delete one",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should delete three",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should delete five",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should add five and delete one",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should set a random length string",
    "file": "test/variablecosts.js"
   },
   {
    "title": "methods that do not throw",
    "file": "test/variablecosts.js"
   },
   {
    "title": "methods that throw",
    "file": "test/variablecosts.js"
   },
   {
    "title": "methods that call methods in other contracts",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should allow contracts to have identically named methods",
    "file": "test/variablecosts.js"
   }
  ],
  "29": [
   {
    "title": "should add one",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should add three",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should add even 5!",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should add five and delete one",
    "file": "test/variablecosts.js"
   }
  ],
  "30": [
   {
    "title": "should add one",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should add three",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should add even 5!",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should add five and delete one",
    "file": "test/variablecosts.js"
   }
  ],
  "34": [
   {
    "title": "should delete one",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should delete three",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should delete five",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should add five and delete one",
    "file": "test/variablecosts.js"
   }
  ],
  "35": [
   {
    "title": "should delete one",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should delete three",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should delete five",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should add five and delete one",
    "file": "test/variablecosts.js"
   }
  ],
  "43": [
   {
    "title": "should set a random length string",
    "file": "test/variablecosts.js"
   }
  ],
  "47": [
   {
    "title": "methods that do not throw",
    "file": "test/variablecosts.js"
   },
   {
    "title": "methods that throw",
    "file": "test/variablecosts.js"
   }
  ],
  "48": [
   {
    "title": "methods that do not throw",
    "file": "test/variablecosts.js"
   }
  ],
  "52": [
   {
    "title": "methods that call methods in other contracts",
    "file": "test/variablecosts.js"
   }
  ],
  "53": [
   {
    "title": "methods that call methods in other contracts",
    "file": "test/variablecosts.js"
   }
  ],
  "54": [
   {
    "title": "methods that call methods in other contracts",
    "file": "test/variablecosts.js"
   }
  ]
 },
 "contracts/Wallets/Wallet.sol": {
  "8": [
   {
    "title": "should allow contracts to have identically named methods",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should allow transfers and sends",
    "file": "test/wallet.js"
   }
  ],
  "12": [
   {
    "title": "should allow contracts to have identically named methods",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should allow transfers and sends",
    "file": "test/wallet.js"
   }
  ],
  "17": [
   {
    "title": "should allow contracts to have identically named methods",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should allow transfers and sends",
    "file": "test/wallet.js"
   }
  ],
  "22": [
   {
    "title": "should allow contracts to have identically named methods",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should allow transfers and sends",
    "file": "test/wallet.js"
   }
  ],
  "23": [
   {
    "title": "should allow contracts to have identically named methods",
    "file": "test/variablecosts.js"
   },
   {
    "title": "should allow transfers and sends",
    "file": "test/wallet.js"
   }
  ]
 }
}
```
