import Cors from 'cors'

// Setup CORS
const cors = Cors({
  methods: ['GET', 'POST', 'OPTIONS'],
  origin: '*',
})

export default cors
