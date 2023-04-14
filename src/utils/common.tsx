


module.exports.generateOrderID = () => ("oi_" + (Math.floor(10000000 + Math.random() * 999999999999)).toString());

module.exports.generateTrackingID = () => ("tri_" + (Math.round(Math.random() * 9999999) + Math.round(Math.random() * 8888)).toString());