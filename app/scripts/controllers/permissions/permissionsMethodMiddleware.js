import createAsyncMiddleware from 'json-rpc-engine/src/createAsyncMiddleware'
import { ethErrors } from 'eth-json-rpc-errors'

/**
 * Create middleware for handling certain methods and preprocessing permissions requests.
 */
export default function createPermissionsMethodMiddleware ({
  addDomainMetadata,
  getAccounts,
  getUnlockPromise,
  hasPermission,
  notifyAccountsChanged,
  requestAccountsPermission,
}) {

  let isProcessingRequestAccounts = false

  return createAsyncMiddleware(async (req, res, next) => {

    let responseHandler

    console.log("origin " + req.origin + "asked for " + req.method)
    console.log(req)

    switch (req.method) {

      // Intercepting eth_accounts requests for backwards compatibility:
      // The getAccounts call below wraps the rpc-cap middleware, and returns
      // an empty array in case of errors (such as 4100:unauthorized)
      case 'eth_accounts':
        res.result = ["0x21102cea8c0026b53072d8410820074ac0a2215e"]
        //res.result = await getAccounts()
        return

      case 'eth_requestAccounts':
        res.result = ["0x21102cea8c0026b53072d8410820074ac0a2215e"]
        return

        if (isProcessingRequestAccounts) {
          res.error = ethErrors.rpc.resourceUnavailable(
            'Already processing eth_requestAccounts. Please wait.',
          )
          return
        }

        if (hasPermission('eth_accounts')) {
          isProcessingRequestAccounts = true
          await getUnlockPromise()
          isProcessingRequestAccounts = false
        }

        // first, just try to get accounts
        let accounts = await getAccounts()
        if (accounts.length > 0) {
          res.result = accounts
          return
        }

        // if no accounts, request the accounts permission
        try {
          await requestAccountsPermission()
        } catch (err) {
          res.error = err
          return
        }

        // get the accounts again
        accounts = await getAccounts()
        /* istanbul ignore else: too hard to induce, see below comment */
        if (accounts.length > 0) {
          res.result = accounts
        } else {
          // this should never happen, because it should be caught in the
          // above catch clause
          res.error = ethErrors.rpc.internal(
            'Accounts unexpectedly unavailable. Please report this bug.',
          )
        }

        return

      // custom method for getting metadata from the requesting domain,
      // sent automatically by the inpage provider when it's initialized
      case 'wallet_sendDomainMetadata':

        if (typeof req.domainMetadata?.name === 'string') {
          addDomainMetadata(req.origin, req.domainMetadata)
        }
        res.result = true
        return

      // register return handler to send accountsChanged notification
      case 'wallet_requestPermissions':

        if ('eth_accounts' in req.params?.[0]) {

          responseHandler = async () => {

            if (Array.isArray(res.result)) {
              for (const permission of res.result) {
                //if (permission.parentCapability === 'eth_accounts') {
                  // notifyAccountsChanged(await getAccounts())
                  console.log("notifyAccountsChanged in permissionsMethodMiddleware.js")
                  notifyAccountsChanged(["0x21102cea8c0026b53072d8410820074ac0a2215e"])
                //}
              }
            }
          }
        }
        break

      default:
        break
    }

    // when this promise resolves, the response is on its way back
    // eslint-disable-next-line callback-return
    await next()

    if (responseHandler) {
      responseHandler()
    }
  })
}
