"use strict"

const protocol = require('protomorphism');
const curry = require('lodash/function/curry');
const Immutable = require('immutable');
const List = Immutable.List;


const Seq = protocol({
    cons: function(coll, elem) {},
    first: function(coll) {},
    rest: function(coll) {},
    isEmpty: function (coll) {},
    empty: function (coll) {}
});

Seq.implementation(Array, {
    cons: (coll, elem) => {
        coll = coll.slice();
        coll.unshift(elem);
        return coll;
    },
    empty: (coll) => [],
    first: (coll) => coll[0],
    rest: (coll) => {
        coll = coll.slice();
        coll.shift(0);
        return coll;
    },
    isEmpty: (coll) => coll.length == 0
});

Seq.implementation(Immutable.List, {
    cons: (coll, elem) => coll.unshift(elem),
    empty: (coll) => Immutable.List.of(),
    first: (coll) => coll.first(),
    rest: (coll) => coll.rest(),
    isEmpty: (coll) => coll.isEmpty()
});



const cons = curry((elem, coll) => Seq.cons(coll, elem));
const first = Seq.first;
const rest = Seq.rest;
const ffirst = (coll) => first(first(coll));
const second = (coll) => first(rest(coll));
const nth = curry((n, coll) => first(drop(n, coll)));
const last = (coll) => {
    if (Seq.isEmpty(coll)) {
        return coll;
    } else if (Seq.isEmpty(rest(coll))) {
        return first(coll);
    } else {
        return last(rest(coll));
    }
}

let log = (...args) => {
    console.log(...args);
    return last(args);
}


const map = curry((f, coll) => {
    if (Seq.isEmpty(coll)) {
        return coll;
    } else {
        return cons(f(first(coll)), map(f, rest(coll)));
    }
})

const filter = curry((pred, coll) => {
    if (Seq.isEmpty(coll)) {
        return coll;
    } else if (pred(first(coll))) {
        return cons(first(coll), filter(pred, rest(coll)));
    } else {
        return filter(pred, rest(coll));
    }
})

const reduce = curry((f, init, coll) => {
    if (Seq.isEmpty(coll)) {
        return init;
    } else {
        return f(reduce(f, init, rest(coll)), first(coll)) 
    }
})

const flow = function (v, ...fns) {
    return reduce((v, f) => f(v), v, fns);
}

const apply = function(f, ...args) {
    return f(...args);
}

const complement = (f) => {
    return function (...args) {
        return !f(...args);
    }
}

const isEven = (x) => x % 2 == 0;
const isOdd = complement(isEven);

const reject = curry((pred, coll) => filter(complement(pred), coll));


const count = (coll) => {
    return reduce((x, y) => x + 1, 0, coll);
}

const conj = curry((coll, elem) => {
    return cons(elem, coll);
});

const concat = curry((coll1, coll2) => {
    if (Seq.isEmpty(coll1)) {
        return coll2;
    } else {
        return cons(first(coll1), concat(rest(coll1), coll2));
    }
});


const distinct = curry((coll) => {
    var innerDistinct = (coll, seen) => {
        if (Seq.isEmpty(coll)) {
            return coll;
        } else if (seen.has(first(coll))) {
            return innerDistinct(rest(coll), seen);
        } else {
            seen.add(first(coll));
            return cons(first(coll), innerDistinct(rest(coll), seen))
        }
    }
    return innerDistinct(coll, new Set())
});

const mapcat = curry((f, coll) => {
    const x = map(f, coll)
    return reduce(concat, first(x), rest(x));
});

const interleave = curry((coll1, coll2) => {
    if (Seq.isEmpty(coll1)) {
        return coll1;
    } else if (Seq.isEmpty(coll2)) {
        return coll2;
    } else {
        return cons(first(coll1), cons(first(coll2), interleave(rest(coll1), rest(coll2))));
    }
});


const interpose = curry((sep, coll) => {
    if (Seq.isEmpty(coll)) {
        return coll;
    } else {
        return cons(first(coll), cons(sep, interpose(sep, rest(coll))));
    }
});

const drop = curry((n, coll) => {
    if (n <= 0 || Seq.isEmpty(coll)) {
        return coll;
    } else {
        return drop(n-1, rest(coll));
    }
});


const dropWhile = curry((pred, coll) => {
    if (Seq.isEmpty(coll)) {
        return coll;
    } else if (pred(first(coll))) {
        return dropWhile(pred, rest(coll));
    } else {
        return coll;
    }
});

const take = curry((n, coll) => {
    if (n == 0) {
        return Seq.empty(coll);
    } else if (Seq.isEmpty(coll)) {
        return coll;
    } else {
        return cons(first(coll), take(n - 1, rest(coll)));
    }
});


const takeNth = curry((n, coll) => {

    const innerTakeNth = (n, i, coll) => {
        if (Seq.isEmpty(coll)) {
            return coll;
        } else if (n % i == 0) {
            return cons(first(coll), innerTakeNth(n, 0, rest(coll)));
        } else {
            return innerTakeNth(n, i+1, rest(coll));
        }
    }
    return innerTakeNth(n, 0, coll);
}); 

const takeWhile = curry((pred, coll) => {
    if (Seq.isEmpty(coll)) {
        return coll;
    } else if (pred(first(coll))) {
        return cons(first(coll), takeWhile(pred, rest(coll)));
    } else {
        return Seq.empty(coll);
    }
});


const butLast = curry((coll) => {
    if (Seq.isEmpty(coll)) {
        return coll;
    } else if (Seq.isEmpty(rest(coll))) {
        return Seq.empty(coll);
    } else {
        return cons(first(coll), butLast(rest(coll)));
    }
});

const dropLast = curry((n, coll) => {
    const innerDropLast = (n, coll1, coll2) => {
        if (Seq.isEmpty(coll1)) {
            return coll1;
        } else if (Seq.isEmpty(coll2)) {
            return Seq.empty(coll1);
        } else {
            return cons(first(coll), dropLast(n, rest(coll1), rest(coll2)));
        }
    }
    return innerDropLast(n, coll, drop(n, coll));
});

const reverse = (coll) => {
    return reduce(conj, Seq.empty(coll), coll);
};

const splitAt = curry((n, coll) => {
    return cons(take(n, coll), cons(drop(n, coll), Seq.empty(coll)));
});

const splitWith = curry((pred, coll) => {
    return cons(takeWhile(pred, coll), cons(dropWhile(pred, coll), Seq.empty(coll)));
});

const partitionAll = curry((n, coll) => {
    if (Seq.isEmpty(coll)) {
        return coll;
    } else {
        return cons(take(n, coll), partitionAll(n, drop(n, coll)));
    }
});

const partitionBy = curry((f, coll) => {
    if (Seq.isEmpty(coll)) {
        return coll;
    } else {
        const elem = first(coll);
        const value = f(elem);
        const part = cons(elem, takeWhile(x => f(x) == value, rest(coll)));
        return cons(part, partitionBy(f,drop(count(part), coll)));
    }
});


const logBoth = (fn, val) => {
    console.log(
        fn(Immutable.fromJS(val)),
        fn(val)
    )
}

logBoth(
    map(x => x + 2), [1,2,3]
)

logBoth(
    filter(isOdd), [1,2,3]
)

logBoth(
   count, [1,2,3]
)

logBoth(
    partitionBy(x => x > 3), [1,2,3,4,5,6]
)