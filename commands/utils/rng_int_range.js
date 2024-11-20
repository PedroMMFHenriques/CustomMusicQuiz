const rng_int_range = (min, max) => { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

exports.rng_int_range = rng_int_range;