const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 中间件
app.use(cors());
app.use(express.json());

// 数据库初始化
const db = new sqlite3.Database('checki-in.db');

// 创建表
db.serialize(() => {
  // 用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 每日任务表
  db.run(`CREATE TABLE IF NOT EXISTS daily_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 10,
    category TEXT,
    created_by INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
  )`);

  // 每日打卡记录表
  db.run(`CREATE TABLE IF NOT EXISTS daily_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    check_date DATE NOT NULL,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (task_id) REFERENCES daily_tasks (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(task_id, user_id, check_date)
  )`);

  // 保留原有表结构用于兼容
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 10,
    category TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // 积分记录表
  db.run(`CREATE TABLE IF NOT EXISTS points_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    points INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('earned', 'spent')),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // 奖励表
  db.run(`CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
  )`);

  // 奖励兑换记录表
  db.run(`CREATE TABLE IF NOT EXISTS reward_redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reward_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    points_spent INTEGER NOT NULL,
    status TEXT DEFAULT 'completed',
    FOREIGN KEY (reward_id) REFERENCES rewards (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
});

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
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
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
    res.status(500).json({ error: '服务器错误' });
  }
});

// 用户登录
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

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
  });
});

// 获取用户信息
app.get('/api/user', authenticateToken, (req, res) => {
  db.get('SELECT id, username FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(user);
  });
});

// 获取所有用户列表（用于统计）
app.get('/api/users', authenticateToken, (req, res) => {
  db.all('SELECT id, username FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(users);
  });
});

// 创建每日任务
app.post('/api/tasks', authenticateToken, (req, res) => {
  const { title, description, points, category } = req.body;

  db.run(
    'INSERT INTO daily_tasks (title, description, points, category, created_by) VALUES (?, ?, ?, ?, ?)',
    [title, description, points || 10, category, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '创建任务失败' });
      }
      res.json({ 
        message: '每日任务创建成功',
        task_id: this.lastID 
      });
    }
  );
});

// 获取每日任务列表（包含今日打卡状态）
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
      AND dc.user_id = ? 
      AND dc.check_date = ?
    WHERE dt.is_active = 1
    ORDER BY dt.created_at DESC
  `;

  db.all(query, [req.user.id, today], (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: '获取任务失败' });
    }
    res.json(tasks);
  });
});

// 更新任务
app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  const { title, description, points, category } = req.body;
  const taskId = req.params.id;

  // 检查任务是否存在且属于当前用户
  db.get('SELECT * FROM daily_tasks WHERE id = ? AND created_by = ?', [taskId, req.user.id], (err, task) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    
    if (!task) {
      return res.status(404).json({ error: '任务不存在或无权限修改' });
    }

    // 更新任务
    db.run(
      'UPDATE daily_tasks SET title = ?, description = ?, points = ?, category = ? WHERE id = ?',
      [title, description, points, category, taskId],
      function(err) {
        if (err) {
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

  // 检查任务是否存在且属于当前用户
  db.get('SELECT * FROM daily_tasks WHERE id = ? AND created_by = ?', [taskId, req.user.id], (err, task) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    
    if (!task) {
      return res.status(404).json({ error: '任务不存在或无权限删除' });
    }

    // 软删除任务（设置为非活跃状态）
    db.run(
      'UPDATE daily_tasks SET is_active = 0 WHERE id = ?',
      [taskId],
      function(err) {
        if (err) {
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

  db.get('SELECT * FROM daily_tasks WHERE id = ? AND is_active = 1', [task_id], (err, task) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // 检查今天是否已经打卡
    db.get(
      'SELECT * FROM daily_checkins WHERE task_id = ? AND user_id = ? AND check_date = ?',
      [task_id, req.user.id, today],
      (err, existingCheckin) => {
        if (err) {
          return res.status(500).json({ error: '服务器错误' });
        }

        if (existingCheckin) {
          return res.status(400).json({ error: '今天已经打卡了' });
        }

        // 执行打卡
        db.run(
          'INSERT INTO daily_checkins (task_id, user_id, check_date, notes) VALUES (?, ?, ?, ?)',
          [task_id, req.user.id, today, notes],
          function(err) {
            if (err) {
              return res.status(500).json({ error: '打卡失败' });
            }

            // 自动获得积分
            db.run(
              'INSERT INTO points_history (user_id, points, type, description) VALUES (?, ?, ?, ?)',
              [req.user.id, task.points, 'earned', `今日完成任务: ${task.title}`]
            );

            res.json({ message: '今日打卡成功！' });
          }
        );
      }
    );
  });
});

// 获取打卡记录
app.get('/api/checkins', authenticateToken, (req, res) => {
  const query = `
    SELECT c.*, t.title as task_title, t.points, u.username as user_name
    FROM checkins c
    JOIN tasks t ON c.task_id = t.id
    JOIN users u ON c.user_id = u.id
    ORDER BY c.checked_at DESC
  `;

  db.all(query, (err, checkins) => {
    if (err) {
      return res.status(500).json({ error: '获取打卡记录失败' });
    }
    res.json(checkins);
  });
});

// 获取积分历史记录
app.get('/api/points', authenticateToken, (req, res) => {
  const query = `
    SELECT ph.*, u.username
    FROM points_history ph
    JOIN users u ON ph.user_id = u.id
    WHERE ph.user_id = ?
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
    WHERE user_id = ?
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
    'INSERT INTO rewards (title, description, points_required, created_by) VALUES (?, ?, ?, ?)',
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

// 获取奖励列表
app.get('/api/rewards', authenticateToken, (req, res) => {
  const query = `
    SELECT r.*, u.username as created_by_name 
    FROM rewards r
    JOIN users u ON r.created_by = u.id
    WHERE r.is_active = 1
    ORDER BY r.created_at DESC
  `;

  db.all(query, (err, rewards) => {
    if (err) {
      return res.status(500).json({ error: '获取奖励失败' });
    }
    res.json(rewards);
  });
});

// 兑换奖励
app.post('/api/rewards/:id/redeem', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM rewards WHERE id = ? AND is_active = 1', [id], (err, reward) => {
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
      WHERE user_id = ?`,
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
          'INSERT INTO reward_redemptions (reward_id, user_id, points_spent) VALUES (?, ?, ?)',
          [id, req.user.id, reward.points_required],
          function(err) {
            if (err) {
              return res.status(500).json({ error: '兑换失败' });
            }

            db.run(
              'INSERT INTO points_history (user_id, points, type, description) VALUES (?, ?, ?, ?)',
              [req.user.id, reward.points_required, 'spent', `兑换奖励: ${reward.title}`]
            );

            res.json({ message: '兑换成功！' });
          }
        );
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
    LEFT JOIN daily_tasks dt ON u.id = dt.created_by AND dt.is_active = 1
    LEFT JOIN daily_checkins dc ON dt.id = dc.task_id AND dc.user_id = u.id AND dc.check_date = ?
    LEFT JOIN points_history ph ON u.id = ph.user_id
    WHERE u.id = ?
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

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 