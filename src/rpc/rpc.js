/* eslint-disable */
import axios from 'axios'

export default {
    request(apiUrl, query, variables) {
        return axios.post(apiUrl, JSON.stringify({ "query": query, "variables": variables }), {
                headers: {'Content-Type': 'application/json'}
            }).then(data=> {
                return data.data
            })
    }
}
