import express from 'express'
import type { ChatContext, ChatMessage } from './chatgpt'
import { chatConfig, chatReplyProcess, currentModel } from './chatgpt'
import { auth } from './middleware/auth'
import { isNotEmptyString } from './utils/is'
import { stringToHex } from './utils'

const app = express()
const router = express.Router()

// app.use(express.static('public'))
// app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.all('*', (_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'authorization, Content-Type')
  res.header('Access-Control-Allow-Methods', '*')
  next()
})

router.post('/chat-process', auth, async (req, res) => {
  res.setHeader('Content-type', 'application/octet-stream')

  try {
    const { prompt, options = {}, dataType = 'browser' } = req.body as { prompt: string; options?: ChatContext; dataType: 'wx' | 'wx2' | 'browser' }
    let firstChunk = true

    await chatReplyProcess(prompt, options, (chat: ChatMessage) => {
      if (dataType === 'wx2') {
        const data = {
          id: chat.id,
          delta: chat.delta,
          text: chat.text,
        }
        res.write(firstChunk ? stringToHex(data) : `\n${stringToHex(data)}`)
      }
      else if (dataType === 'wx') {
        chat.delta = ''
        if (chat.detail?.choices) {
          chat.detail.choices = chat.detail?.choices?.map((item) => {
            if (item?.delta?.content)
              item.delta.content = ''
            return item
          })
        }
        res.write(firstChunk ? stringToHex(chat) : `\n${stringToHex(chat)}`)
      }
      else {
        res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`)
      }
      firstChunk = false
    })
  }
  catch (error) {
    res.write(JSON.stringify(error))
  }
  finally {
    // const { openid } = req.body as { openid: string }
    // const sql = 'UPDATE users SET count = count - 1 WHERE openid = ?'
    // exec(sql, [openid])
    res.end()
  }
})

router.post('/config', async (req, res) => {
  try {
    const response = await chatConfig()
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

router.post('/session', async (req, res) => {
  try {
    const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY
    const hasAuth = isNotEmptyString(AUTH_SECRET_KEY)
    res.send({ status: 'Success', message: '', data: { auth: hasAuth, model: currentModel() } })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body as { token: string }
    if (!token)
      throw new Error('Secret key is empty')

    if (process.env.AUTH_SECRET_KEY !== token)
      throw new Error('密钥无效 | Secret key is invalid')

    res.send({ status: 'Success', message: 'Verify successfully', data: null })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

app.use('', router)
app.use('/api', router)

app.listen(3002, () => globalThis.console.log('Server is running on port 3002'))
