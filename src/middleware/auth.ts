import { isNotEmptyString } from '../utils/is'
import { exec } from '../database'

const auth = async (req, res, next) => {
  const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY
  if (isNotEmptyString(AUTH_SECRET_KEY)) {
    try {
      const Authorization = req.header('Authorization')

      if (!Authorization || Authorization.replace('Bearer ', '').trim() !== AUTH_SECRET_KEY.trim())
        throw new Error('Error: 无访问权限 | No access rights')
      next()
    }
    catch (error) {
      res.send({ status: 'Unauthorized', message: error.message ?? 'Please authenticate.', data: null })
    }
  }
  else {
    next()
  }
}

const authCount = async (req, res, next) => {
  const { openid } = req.body as { openid: string }
  try {
    if (!openid)
      throw new Error('openid 无效')

    const sql = `
      SELECT u.id, u.openid, u.count, u.role_id roleId, u.sign_in_time signInTime, u.share_time shareTime,
      IF(TO_DAYS(u.sign_in_time) = TO_DAYS(CURRENT_DATE), 1, 0) isSignIn,
      IF(TO_DAYS(u.share_time) = TO_DAYS(CURRENT_DATE),1,0) isShare,
      (SELECT name FROM roles WHERE id = u.role_id) role
      FROM users u WHERE openid = ?
    `
    const [result] = await exec(sql, [openid])

    if (result.roleId === process.env.DEFAULT_ROLE_ID && result.count < 1)
      throw new Error('次数不足')

    next()
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
}

export { auth, authCount }
