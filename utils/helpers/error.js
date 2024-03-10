class httpError extends Error {
  constructor(name = 'httpError', status, data = {}, message, metadata = {}) {
    super(message);
    this.name = 'name';
    this.data = data;
    this.status = status;
    this.description = data?.error || data?.err || message;
    this.metadata = metadata;
    this.type = 'http';
  }
}

const handleAppError = async({ err, scope= 'handleAppError', status, metadata= {}, log= null, ship= true, timezone }) => {
  console.log("Error occured ", err)
};

module.export = {
  httpError,
  handleAppError
}
