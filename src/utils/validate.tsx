module.exports.isValidString = (str: string) => {
   return (/^(?:\d+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(?=.*[a-z])(?=.*[A-Z]).+)$/).test(str);
}