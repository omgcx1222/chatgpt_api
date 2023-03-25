import mysql from 'mysql'
// import * as dotenv from 'dotenv'
// dotenv.config()

const connection = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
})

const exec = (sql: string, values: string[]) => {
  return new Promise<any>((resolve, reject) => {
    connection.getConnection((err, conn) => {
      if (err) {
        reject(err)
      }
      else {
        // global.console.log('连接数据库成功')
        conn.query(sql, values, (err, data) => {
          if (err) {
            reject(err)
          }
          else {
            // global.console.log(data)
            resolve(data)
          }
        })
        conn.release()
      }
    })
  })
}

export { exec }
