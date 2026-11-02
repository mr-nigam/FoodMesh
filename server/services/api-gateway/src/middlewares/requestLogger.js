import morgan from "morgan";


const requestLogger = morgan(
    ":method :url :status :response-time ms"
);


export default requestLogger;