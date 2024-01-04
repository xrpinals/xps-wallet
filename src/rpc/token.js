import rpc from './rpc'

export default {
    listUserTokenBalances(apiUrl, address, limit, offset) {
        return rpc.request(apiUrl, `
        query TokenExplorer($address: String!, $limit: Int, $offset: Int) {
           listUserTokenBalances(address: $address, limit: $limit, offset: $offset) {
               items {
                   id
                   contract_addr
                   token_name
                   token_symbol
                   precision
                   owner_addr
                   amount
                   created_at
                   updated_at
               }
               total
           }
        }`, {
            address,
            limit,
            offset
        })
    }
}
