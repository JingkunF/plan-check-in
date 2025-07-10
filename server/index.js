const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://www.jihuadaka.top',
  'https://plan-check-in-oiga.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    // 允许无 Origin（如 curl/postman）或在白名单内
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 数据库配置
let db;
if (process.env.DATABASE_URL) {
  // 使用PostgreSQL（生产环境）
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  // 创建PostgreSQL适配器
  db = {
    run: (sql, params, callback) => {
      pool.query(sql, params, (err, result) => {
        if (callback) callback(err, { lastID: result?.rows?.[0]?.id });
      });
    },
    get: (sql, params, callback) => {
      pool.query(sql, params, (err, result) => {
        if (callback) callback(err, result?.rows?.[0]);
      });
    },
    all: (sql, params, callback) => {
      pool.query(sql, params, (err, result) => {
        if (callback) callback(err, result?.rows || []);
      });
    }
  };
} else {
  // 使用SQLite（开发环境）
  db = new sqlite3.Database('checki-in.db');
}

// 创建表
const createTables = async () => {
  const tables = [
    // 用户表
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // 每日任务表
    `CREATE TABLE IF NOT EXISTS daily_tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      points INTEGER DEFAULT 10,
      category TEXT,
      created_by INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users (id)
    )`,
    
    // 每日打卡记录表
    `CREATE TABLE IF NOT EXISTS daily_checkins (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      check_date DATE NOT NULL,
      checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (task_id) REFERENCES daily_tasks (id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(task_id, user_id, check_date)
    )`,
    
    // 积分记录表
    `CREATE TABLE IF NOT EXISTS points_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      points INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('earned', 'spent')),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`,
    
    // 奖励表
    `CREATE TABLE IF NOT EXISTS rewards (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      points_required INTEGER NOT NULL,
      created_by INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users (id)
    )`,
    
    // 奖励兑换记录表
    `CREATE TABLE IF NOT EXISTS reward_redemptions (
      id SERIAL PRIMARY KEY,
      reward_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      points_spent INTEGER NOT NULL,
      status TEXT DEFAULT 'completed',
      FOREIGN KEY (reward_id) REFERENCES rewards (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`
  ];

  for (const table of tables) {
    await new Promise((resolve, reject) => {
      db.run(table, [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

createTables().catch(console.error);

// JWT验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '无效的访问令牌' });
    }
    req.user = user;
    next();
  });
};

// 用户注册
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, hashedPassword],
      function(err) {
        if (err) {
          console.error('注册时数据库错误:', err);
          if (err.message && err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: '用户名已存在' });
          }
          return res.status(500).json({ error: '注册失败' });
        }
        
        res.json({ 
          message: '注册成功',
          user_id: this.lastID 
        });
      }
    );
  } catch (error) {
    console.error('注册时异常:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 用户登录
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = $1', [username], async (err, user) => {
    if (err) {
      console.error('登录时数据库查询错误:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
    
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    try {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username
        }
      });
    } catch (error) {
      console.error('登录时密码校验或签名异常:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  });
});

// 获取用户信息
app.get('/api/user', authenticateToken, (req, res) => {
  db.get('SELECT id, username FROM users WHERE id = $1', [req.user.id], (err, user) => {
    if (err) {
      console.error('获取用户信息失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(user);
  });
});

// 获取所有用户列表（用于统计）
app.get('/api/users', authenticateToken, (req, res) => {
  db.all('SELECT id, username FROM users', [], (err, users) => {
    if (err) {
      console.error('获取用户列表失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(users);
  });
});

// 创建每日任务
app.post('/api/tasks', authenticateToken, (req, res) => {
  const { title, description, points, category } = req.body;

  db.run(
    'INSERT INTO daily_tasks (title, description, points, category, created_by) VALUES ($1, $2, $3, $4, $5)',
    [title, description, points || 10, category, req.user.id],
    function(err) {
      if (err) {
        console.error('创建每日任务失败:', err);
        return res.status(500).json({ error: '创建任务失败' });
      }
      res.json({ 
        message: '每日任务创建成功',
        task_id: this.lastID 
      });
    }
  );
});

// 获取每日任务列表（只返回当前用户创建的任务）
app.get('/api/tasks', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const query = `
    SELECT 
      dt.*, 
      u.username as created_by_name,
      CASE WHEN dc.id IS NOT NULL THEN 1 ELSE 0 END as checked_today,
      dc.notes as today_notes
    FROM daily_tasks dt
    JOIN users u ON dt.created_by = u.id 
    LEFT JOIN daily_checkins dc ON dt.id = dc.task_id 
      AND dc.user_id = $1 
      AND dc.check_date = $2
    WHERE dt.is_active = true AND dt.created_by = $1
    ORDER BY dt.created_at DESC
  `;
  db.all(query, [req.user.id, today], (err, tasks) => {
    if (err) {
      console.error('获取每日任务失败:', err);
      return res.status(500).json({ error: '获取任务失败' });
    }
    res.json(tasks);
  });
});

// 更新任务
app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  const { title, description, points, category } = req.body;
  const taskId = req.params.id;

  db.get('SELECT * FROM daily_tasks WHERE id = $1 AND created_by = $2', [taskId, req.user.id], (err, task) => {
    if (err) {
      console.error('查询任务失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
    
    if (!task) {
      return res.status(404).json({ error: '任务不存在或无权限修改' });
    }

    db.run(
      'UPDATE daily_tasks SET title = $1, description = $2, points = $3, category = $4 WHERE id = $5',
      [title, description, points, category, taskId],
      function(err) {
        if (err) {
          console.error('更新任务失败:', err);
          return res.status(500).json({ error: '更新任务失败' });
        }
        res.json({ message: '任务更新成功' });
      }
    );
  });
});

// 删除任务
app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  const taskId = req.params.id;

  db.get('SELECT * FROM daily_tasks WHERE id = $1 AND created_by = $2', [taskId, req.user.id], (err, task) => {
    if (err) {
      console.error('查询任务失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
    
    if (!task) {
      return res.status(404).json({ error: '任务不存在或无权限删除' });
    }

    db.run(
      'UPDATE daily_tasks SET is_active = false WHERE id = $1',
      [taskId],
      function(err) {
        if (err) {
          console.error('删除任务失败:', err);
          return res.status(500).json({ error: '删除任务失败' });
        }
        res.json({ message: '任务删除成功' });
      }
    );
  });
});

// 每日打卡
app.post('/api/checkin', authenticateToken, (req, res) => {
  const { task_id, notes } = req.body;

  db.get('SELECT * FROM daily_tasks WHERE id = $1 AND is_active = true', [task_id], (err, task) => {
    if (err) {
      console.error('查询每日任务失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
    
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    db.get(
      'SELECT * FROM daily_checkins WHERE task_id = $1 AND user_id = $2 AND check_date = $3',
      [task_id, req.user.id, today],
      (err, existingCheckin) => {
        if (err) {
          console.error('查询今日打卡失败:', err);
          return res.status(500).json({ error: '服务器错误' });
        }

        if (existingCheckin) {
          return res.status(400).json({ error: '今天已经打卡了' });
        }

        db.run(
          'INSERT INTO daily_checkins (task_id, user_id, check_date, notes) VALUES ($1, $2, $3, $4)',
          [task_id, req.user.id, today, notes],
          function(err) {
            if (err) {
              console.error('插入打卡记录失败:', err);
              return res.status(500).json({ error: '打卡失败' });
            }

            db.run(
              'INSERT INTO points_history (user_id, points, type, description) VALUES ($1, $2, $3, $4)',
              [req.user.id, task.points, 'earned', `今日完成任务: ${task.title}`],
              function(err) {
                if (err) {
                  console.error('插入积分历史失败:', err);
                }
              }
            );

            res.json({ message: '今日打卡成功！' });
          }
        );
      }
    );
  });
});

// 获取打卡记录（只返回当前用户的打卡记录）
app.get('/api/checkins', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT dc.*, dt.title as task_title, dt.points, u.username as user_name
      FROM daily_checkins dc
      JOIN daily_tasks dt ON dc.task_id = dt.id
      JOIN users u ON dc.user_id = u.id
      WHERE dc.user_id = $1
      ORDER BY dc.checked_at DESC
    `;
    db.all(query, [req.user.id], (err, checkins) => {
      if (err) {
        console.error('获取打卡记录失败:', err);
        return res.status(500).json({ error: '获取打卡记录失败' });
      }
      res.json(checkins);
    });
  } catch (err) {
    console.error('Error in /api/checkins:', err);
    res.status(500).json({ error: err.message });
  }
});

// 获取积分历史记录
app.get('/api/points', authenticateToken, (req, res) => {
  const query = `
    SELECT ph.*, u.username
    FROM points_history ph
    JOIN users u ON ph.user_id = u.id
    WHERE ph.user_id = $1
    ORDER BY ph.created_at DESC
  `;

  db.all(query, [req.user.id], (err, points) => {
    if (err) {
      return res.status(500).json({ error: '获取积分历史失败' });
    }
    res.json(points);
  });
});

// 获取积分余额
app.get('/api/points/balance', authenticateToken, (req, res) => {
  const query = `
    SELECT COALESCE(SUM(CASE WHEN type = 'earned' THEN points ELSE 0 END), 0) as earned,
           COALESCE(SUM(CASE WHEN type = 'spent' THEN points ELSE 0 END), 0) as spent
    FROM points_history 
    WHERE user_id = $1
  `;

  db.get(query, [req.user.id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: '获取积分余额失败' });
    }

    const balance = result ? result.earned - result.spent : 0;
    res.json({ balance });
  });
});

// 创建奖励
app.post('/api/rewards', authenticateToken, (req, res) => {
  const { title, description, points_required } = req.body;

  db.run(
    'INSERT INTO rewards (title, description, points_required, created_by) VALUES ($1, $2, $3, $4)',
    [title, description, points_required, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '创建奖励失败' });
      }
      res.json({ 
        message: '奖励创建成功',
        reward_id: this.lastID 
      });
    }
  );
});

// 获取奖励列表（只返回当前用户创建的奖励）
app.get('/api/rewards', authenticateToken, (req, res) => {
  const query = `
    SELECT r.*, u.username as created_by_name 
    FROM rewards r
    JOIN users u ON r.created_by = u.id
    WHERE r.is_active = true AND r.created_by = $1
    ORDER BY r.created_at DESC
  `;
  db.all(query, [req.user.id], (err, rewards) => {
    if (err) {
      return res.status(500).json({ error: '获取奖励失败' });
    }
    res.json(rewards);
  });
});

// 兑换奖励
app.post('/api/rewards/:id/redeem', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM rewards WHERE id = $1 AND is_active = true', [id], (err, reward) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }

    if (!reward) {
      return res.status(404).json({ error: '奖励不存在' });
    }

    db.get(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'earned' THEN points ELSE 0 END), 0) as earned,
        COALESCE(SUM(CASE WHEN type = 'spent' THEN points ELSE 0 END), 0) as spent
      FROM points_history 
      WHERE user_id = $1`,
      [req.user.id],
      (err, points) => {
        if (err) {
          return res.status(500).json({ error: '服务器错误' });
        }

        const balance = points.earned - points.spent;
        if (balance < reward.points_required) {
          return res.status(400).json({ error: '积分不足' });
        }

        db.run(
          'INSERT INTO reward_redemptions (reward_id, user_id, points_spent) VALUES ($1, $2, $3)',
          [id, req.user.id, reward.points_required],
          function(err) {
            if (err) {
              return res.status(500).json({ error: '兑换失败' });
            }

            db.run(
              'INSERT INTO points_history (user_id, points, type, description) VALUES ($1, $2, $3, $4)',
              [req.user.id, reward.points_required, 'spent', `兑换奖励: ${reward.title}`]
            );

            res.json({ message: '兑换成功！' });
          }
        );
      }
    );
  });
});

// 编辑奖励
app.put('/api/rewards/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description, points_required } = req.body;

  // 检查奖励是否存在且属于当前用户
  db.get('SELECT * FROM rewards WHERE id = $1 AND created_by = $2 AND is_active = true', [id, req.user.id], (err, reward) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    
    if (!reward) {
      return res.status(404).json({ error: '奖励不存在或无权限修改' });
    }

    // 更新奖励
    db.run(
      'UPDATE rewards SET title = $1, description = $2, points_required = $3 WHERE id = $4',
      [title, description, points_required, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: '更新奖励失败' });
        }
        res.json({ message: '奖励更新成功' });
      }
    );
  });
});

// 删除奖励
app.delete('/api/rewards/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  // 检查奖励是否存在且属于当前用户
  db.get('SELECT * FROM rewards WHERE id = $1 AND created_by = $2 AND is_active = true', [id, req.user.id], (err, reward) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    
    if (!reward) {
      return res.status(404).json({ error: '奖励不存在或无权限删除' });
    }

    // 软删除奖励（设置为非活跃状态）
    db.run(
      'UPDATE rewards SET is_active = false WHERE id = $1',
      [id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: '删除奖励失败' });
        }
        res.json({ message: '奖励删除成功' });
      }
    );
  });
});

// 获取今日统计数据
app.get('/api/stats', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  db.get(`
    SELECT 
      COUNT(DISTINCT dt.id) as total_tasks,
      COUNT(DISTINCT dc.id) as today_checkins,
      COALESCE(SUM(CASE WHEN ph.type = 'earned' THEN ph.points ELSE 0 END), 0) as total_earned,
      COALESCE(SUM(CASE WHEN ph.type = 'spent' THEN ph.points ELSE 0 END), 0) as total_spent
    FROM users u
    LEFT JOIN daily_tasks dt ON u.id = dt.created_by AND dt.is_active = true
    LEFT JOIN daily_checkins dc ON dt.id = dc.task_id AND dc.user_id = u.id AND dc.check_date = $1
    LEFT JOIN points_history ph ON u.id = ph.user_id
    WHERE u.id = $2
  `, [today, req.user.id], (err, stats) => {
    if (err) {
      return res.status(500).json({ error: '获取统计数据失败' });
    }
    
    const todayCompletionRate = stats.total_tasks > 0 ? 
      ((stats.today_checkins / stats.total_tasks) * 100).toFixed(1) : 0;
    
    res.json({
      ...stats,
      balance: stats.total_earned - stats.total_spent,
      completion_rate: todayCompletionRate,
      total_checkins: stats.today_checkins
    });
  });
});

// 获取健康检查状态
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 在所有路由后添加全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 