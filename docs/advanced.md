# Advanced Use

## Skipping certain tests

Sometimes there are tests which don't work that well with coverage and it's convenient to skip them.
You can do this by tagging your test descriptions and filtering them out with the mocha options
in .solcover.js:

**Example**
```javascript
// Mocha test to skip
it("is a gas usage simulation [ @skip-on-coverage ]", async function(){
 ...
})
```

```javascript
//.solcover.js
module.exports = {
  mocha: {
    grep: "@skip-on-coverage", // Find everything with this tag
    invert: true               // Run the grep's inverse set.
  }
}
```

## Workflow hooks

Coverage exposes a set of workflow hooks that let you run arbitrary async logic between certain
stages of the coverage generation process. These are
