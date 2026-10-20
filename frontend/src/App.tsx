import React, { useState, useMemo } from 'react'
import {
  Wrench,
  Car,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  TrendingUp,
  Plus,
  CheckCircle2,
  Clock,
  LogOut,
  Activity,
  FileText,
  Search,
  Settings,
  AlertCircle,
  Trash2,
  PlusCircle,
  ArrowLeft,
  Sliders,
  DollarSign
} from 'lucide-react'
import './App.css'

// --- TYPE DEFINITIONS ---
interface JobLine {
  id: string
  type: 'Service' | 'Part'
  description: string
  qty: number
  price: number
}

interface JobCard {
  no: string
  branch: string
  customer: string
  vehicle: string
  date: string
  mileage: number
  status: 'Open' | 'In Service' | 'Ready' | 'Billed' | 'Cancelled'
  complaints: string
  lines: JobLine[]
  total: number
}

interface MasterItem {
  description: string
  type: 'Service' | 'Part'
  price: number
}

// --- INITIAL MOCK DATA ---
const initialJobCards: JobCard[] = [
  {
    no: 'JC000042',
    branch: 'colombo',
    customer: 'John Silva',
    vehicle: 'CAB-1234',
    date: '2026-07-20',
    mileage: 125320,
    status: 'In Service',
    complaints: 'Engine noise on acceleration\nAC cooling is very low',
    lines: [
      { id: '1', type: 'Service', description: 'Replace Engine Oil', qty: 1, price: 3500 },
      { id: '2', type: 'Part', description: 'Mobil 1 Engine Oil 4L', qty: 1, price: 16500 },
      { id: '3', type: 'Service', description: 'AC Cabin Filter Clean', qty: 1, price: 1500 }
    ],
    total: 21500
  },
  {
    no: 'JC000041',
    branch: 'colombo',
    customer: 'Ruchira Perera',
    vehicle: 'WP-CAD-8932',
    date: '2026-07-19',
    mileage: 85210,
    status: 'Ready',
    complaints: 'Brakes squeaking when stopping',
    lines: [
      { id: '1', type: 'Service', description: 'Replace Brake Pads', qty: 1, price: 4500 },
      { id: '2', type: 'Part', description: 'Bosch Front Brake Pads', qty: 1, price: 12000 }
    ],
    total: 16500
  },
  {
    no: 'JC000040',
    branch: 'kandy',
    customer: 'Ameen Hassan',
    vehicle: 'EP-PB-4521',
    date: '2026-07-18',
    mileage: 142000,
    status: 'Open',
    complaints: 'Body washing and interior vacuum clean',
    lines: [
      { id: '1', type: 'Service', description: 'Full Wash & Vacuum', qty: 1, price: 3000 }
    ],
    total: 3000
  },
  {
    no: 'JC000039',
    branch: 'galle',
    customer: 'Nimmi Fernando',
    vehicle: 'WP-CB-6712',
    date: '2026-07-18',
    mileage: 62400,
    status: 'Billed',
    complaints: 'Battery is weak, hard to start in morning',
    lines: [
      { id: '1', type: 'Part', description: 'Amaron Battery 12V 45Ah', qty: 1, price: 18500 },
      { id: '2', type: 'Service', description: 'Battery Replacement Service', qty: 1, price: 1000 }
    ],
    total: 19500
  }
]

// Master data lists for autocomplete suggestions
const defaultServiceMaster: MasterItem[] = [
  { description: 'Replace Engine Oil', type: 'Service', price: 3500 },
  { description: 'Replace Brake Pads', type: 'Service', price: 4500 },
  { description: 'AC Cabin Filter Clean', type: 'Service', price: 1500 },
  { description: 'Wheel Alignment & Balancing', type: 'Service', price: 2500 },
  { description: 'Full Wash & Vacuum', type: 'Service', price: 3000 },
  { description: 'Brake Fluid Bleeding', type: 'Service', price: 1800 },
  { description: 'Battery Replacement Service', type: 'Service', price: 1000 },
  { description: 'AC Gas Top Up', type: 'Service', price: 4500 }
]

const defaultItemMaster: MasterItem[] = [
  { description: 'Mobil 1 Engine Oil 4L', type: 'Part', price: 16500 },
  { description: 'Bosch Front Brake Pads', type: 'Part', price: 12000 },
  { description: 'Amaron Battery 12V 45Ah', type: 'Part', price: 18500 },
  { description: 'Denso Spark Plug', type: 'Part', price: 1200 },
  { description: 'Air Filter', type: 'Part', price: 3200 },
  { description: 'AC Cabin Filter', type: 'Part', price: 4500 },
  { description: 'Brake Fluid Dot 4', type: 'Part', price: 850 },
  { description: 'Oil Filter', type: 'Part', price: 2400 }
]

function App() {
  // --- AUTHENTICATION STATES ---
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [branch, setBranch] = useState('colombo')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // --- CORE DATA STATES ---
  const [jobCards, setJobCards] = useState<JobCard[]>(initialJobCards)
  const [serviceMaster, setServiceMaster] = useState<MasterItem[]>(defaultServiceMaster)
  const [itemMaster, setItemMaster] = useState<MasterItem[]>(defaultItemMaster)

  // --- SETTINGS STATES ---
  // Default system settings as described in AutoServe.docx
  const [autoCreateService, setAutoCreateService] = useState(true)
  const [requireConfirmation, setRequireConfirmation] = useState(false)

  // --- NAVIGATION & SUB-VIEW STATES ---
  const [activeTab, setActiveTab] = useState('dashboard') // dashboard | jobcards | inventory | settings
  const [jobCardSubView, setJobCardSubView] = useState<'registry' | 'editor'>('registry')
  
  // --- JOB CARD EDITOR STATES ---
  const [editingCardId, setEditingCardId] = useState<string | null>(null) // null = Create New
  const [jcNo, setJcNo] = useState('')
  const [jcCustomer, setJcCustomer] = useState('')
  const [jcVehicle, setJcVehicle] = useState('')
  const [jcMileage, setJcMileage] = useState<number | ''>('')
  const [jcDate, setJcDate] = useState('')
  const [jcStatus, setJcStatus] = useState<JobCard['status']>('Open')
  const [jcComplaints, setJcComplaints] = useState('')
  const [jcLines, setJcLines] = useState<JobLine[]>([])
  
  // --- ADD LINE STATES ---
  const [lineType, setLineType] = useState<'Service' | 'Part'>('Service')
  const [lineDesc, setLineDesc] = useState('')
  const [lineQty, setLineQty] = useState(1)
  const [linePrice, setLinePrice] = useState<number | ''>('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; text: string } | null>(null)

  // --- SEARCH & FILTER STATES ---
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')

  // --- HANDLERS ---

  // Fill in demo credentials
  const handleQuickLogin = (role: 'admin' | 'manager') => {
    setErrorMsg('')
    if (role === 'admin') {
      setEmail('janithnilan@gmail.com')
      setPassword('admin1234')
      setBranch('colombo')
    } else {
      setEmail('manager@autoserve.com')
      setPassword('manager1234')
      setBranch('kandy')
    }
  }

  // Handle Sign In submission
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!email) {
      setErrorMsg('Please enter your email address.')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address.')
      return
    }

    if (!password) {
      setErrorMsg('Please enter your password.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsLoggedIn(true)
      setActiveTab('dashboard')
    }, 1200)
  }

  // Sign out
  const handleLogout = () => {
    setIsLoggedIn(false)
    setPassword('')
    setErrorMsg('')
  }

  // Set up states for editing or creating a job card
  const handleOpenEditor = (card: JobCard | null) => {
    if (card) {
      // Editing Mode
      setEditingCardId(card.no)
      setJcNo(card.no)
      setJcCustomer(card.customer)
      setJcVehicle(card.vehicle)
      setJcMileage(card.mileage)
      setJcDate(card.date)
      setJcStatus(card.status)
      setJcComplaints(card.complaints)
      setJcLines(card.lines)
    } else {
      // Create New Mode
      setEditingCardId(null)
      // Auto-generate Job Card Number
      const nextNum = jobCards.length > 0 
        ? Math.max(...jobCards.map(c => parseInt(c.no.replace('JC', '')))) + 1 
        : 1
      const generatedNo = `JC${String(nextNum).padStart(6, '0')}`
      
      setJcNo(generatedNo)
      setJcCustomer('')
      setJcVehicle('')
      setJcMileage('')
      setJcDate(new Date().toISOString().split('T')[0])
      setJcStatus('Open')
      setJcComplaints('')
      setJcLines([])
    }
    
    // Reset Add Line Form states
    setLineType('Service')
    setLineDesc('')
    setLineQty(1)
    setLinePrice('')
    setShowSuggestions(false)
    setNotification(null)

    setJobCardSubView('editor')
  }

  // Autocomplete filtered list based on typed description and line type
  const filteredSuggestions = useMemo(() => {
    const list = lineType === 'Service' ? serviceMaster : itemMaster
    if (!lineDesc) return []
    return list.filter(item => 
      item.description.toLowerCase().includes(lineDesc.toLowerCase())
    )
  }, [lineType, lineDesc, serviceMaster, itemMaster])

  // Handle clicking a suggestion from autocomplete
  const handleSelectSuggestion = (item: MasterItem) => {
    setLineDesc(item.description)
    setLinePrice(item.price)
    setShowSuggestions(false)
  }

  // Add a line item to the Job Card
  const handleAddLine = () => {
    if (!lineDesc.trim()) {
      alert('Please enter a description for the item/service.')
      return
    }
    
    const priceValue = Number(linePrice) || 0
    const newLine: JobLine = {
      id: String(Date.now()),
      type: lineType,
      description: lineDesc,
      qty: lineQty,
      price: priceValue
    }

    setJcLines(prev => [...prev, newLine])

    // --- CHECK SERVICE/ITEM MASTER AUTO-CREATION ---
    const currentMasterList = lineType === 'Service' ? serviceMaster : itemMaster
    const matchExists = currentMasterList.some(
      item => item.description.toLowerCase() === lineDesc.trim().toLowerCase()
    )

    if (!matchExists) {
      const newMaster: MasterItem = {
        description: lineDesc.trim(),
        type: lineType,
        price: priceValue
      }

      if (autoCreateService) {
        // Option 1: Auto create in background (Default)
        if (lineType === 'Service') {
          setServiceMaster(prev => [...prev, newMaster])
        } else {
          setItemMaster(prev => [...prev, newMaster])
        }
        showNotification('success', `Auto-created master record: "${newMaster.description}"`)
      } else if (requireConfirmation) {
        // Option 2: Ask/Notify before creating
        const confirmAdd = window.confirm(`Create new master entry for "${newMaster.description}" with price Rs. ${priceValue}?`)
        if (confirmAdd) {
          if (lineType === 'Service') {
            setServiceMaster(prev => [...prev, newMaster])
          } else {
            setItemMaster(prev => [...prev, newMaster])
          }
          showNotification('success', `Added new master: "${newMaster.description}"`)
        }
      }
    }

    // Reset line fields
    setLineDesc('')
    setLineQty(1)
    setLinePrice('')
    setShowSuggestions(false)
  }

  // Trigger brief alert notifications in editor
  const showNotification = (type: 'success' | 'info', text: string) => {
    setNotification({ type, text })
    setTimeout(() => {
      setNotification(null)
    }, 4000)
  }

  // Remove a line item from the Job Card
  const handleRemoveLine = (id: string) => {
    setJcLines(prev => prev.filter(line => line.id !== id))
  }

  // Sum total of current job card lines
  const computedTotal = useMemo(() => {
    return jcLines.reduce((sum, line) => sum + (line.qty * line.price), 0)
  }, [jcLines])

  // Save the entire Job Card (update existing or add new)
  const handleSaveJobCard = (e: React.FormEvent) => {
    e.preventDefault()

    if (!jcCustomer.trim()) {
      alert('Please enter a customer name.')
      return
    }
    if (!jcVehicle.trim()) {
      alert('Please enter a vehicle registration number.')
      return
    }

    const savedCard: JobCard = {
      no: jcNo,
      branch: branch,
      customer: jcCustomer.trim(),
      vehicle: jcVehicle.trim().toUpperCase(),
      date: jcDate,
      mileage: Number(jcMileage) || 0,
      status: jcStatus,
      complaints: jcComplaints,
      lines: jcLines,
      total: computedTotal
    }

    if (editingCardId) {
      // Update existing
      setJobCards(prev => prev.map(c => c.no === editingCardId ? savedCard : c))
    } else {
      // Add new
      setJobCards(prev => [savedCard, ...prev])
    }

    setJobCardSubView('registry')
  }

  // Filter job cards list for the registry view
  const filteredJobCards = useMemo(() => {
    return jobCards.filter(card => {
      // Search term
      const matchesSearch = 
        card.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.no.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Status filter
      const matchesStatus = statusFilter === 'All' || card.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [jobCards, searchTerm, statusFilter])

  // Delete Job Card from list
  const handleDeleteJobCard = (no: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the row click (editing)
    if (window.confirm(`Are you sure you want to delete Job Card ${no}?`)) {
      setJobCards(prev => prev.filter(c => c.no !== no))
    }
  }

  const getBranchLabel = (branchCode: string) => {
    switch (branchCode) {
      case 'colombo': return 'Colombo (HQ)'
      case 'kandy': return 'Kandy'
      case 'galle': return 'Galle'
      default: return 'Main Office'
    }
  }

  const getStatusBadgeClass = (status: JobCard['status']) => {
    switch (status) {
      case 'Open': return 'badge-blue'
      case 'In Service': return 'badge-warning'
      case 'Ready': return 'badge-success'
      case 'Billed': return 'badge-success' // Billed is green as well
      case 'Cancelled': return 'badge-danger'
      default: return 'badge-blue'
    }
  }

  // --- RENDER VIEWS ---

  if (isLoggedIn) {
    return (
      <div className="dashboard-container" id="dashboard-view">
        {/* SIDEBAR NAVIGATION */}
        <aside className="sidebar">
          <div>
            <div className="sidebar-brand">
              <div className="logo-icon-wrapper" style={{ width: 36, height: 36 }}>
                <Wrench className="logo-icon" size={20} color="white" />
              </div>
              <span className="logo-text" style={{ fontSize: '1.25rem' }}>AutoServe ERP</span>
            </div>
            
            <nav className="sidebar-nav">
              <div 
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => { setActiveTab('dashboard'); setJobCardSubView('registry'); }}
                id="nav-dash"
              >
                <Activity size={18} />
                <span>Dashboard</span>
              </div>
              <div 
                className={`nav-item ${activeTab === 'jobcards' ? 'active' : ''}`}
                onClick={() => { setActiveTab('jobcards'); setJobCardSubView('registry'); }}
                id="nav-jobs"
              >
                <FileText size={18} />
                <span>Job Cards</span>
              </div>
              <div 
                className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
                onClick={() => setActiveTab('inventory')}
                id="nav-inv"
              >
                <Wrench size={18} />
                <span>Inventory</span>
              </div>
              <div 
                className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
                id="nav-settings"
              >
                <Settings size={18} />
                <span>Settings</span>
              </div>
            </nav>
          </div>

          <div className="sidebar-user">
            <div className="user-avatar-info">
              <div className="avatar">
                {email === 'janithnilan@gmail.com' ? 'JN' : 'M'}
              </div>
              <div className="flex flex-col">
                <span className="user-name">
                  {email === 'janithnilan@gmail.com' ? 'Janith Nilan' : 'Service Manager'}
                </span>
                <span className="user-role">
                  {email === 'janithnilan@gmail.com' ? 'Administrator' : 'Manager'}
                </span>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout" id="btn-logout">
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        {/* MAIN DISPLAY REGION */}
        <main className="main-content">
          <header className="top-bar">
            <h2 className="top-bar-title">
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'jobcards' && (jobCardSubView === 'registry' ? 'Job Cards Registry' : 'Job Card Editor')}
              {activeTab === 'inventory' && 'Inventory Master'}
              {activeTab === 'settings' && 'System Settings'}
            </h2>
            <div className="branch-badge">
              <Building2 size={14} />
              <span>{getBranchLabel(branch)}</span>
            </div>
          </header>

          <div className="dashboard-viewport">
            
            {/* 1. DASHBOARD VIEW */}
            {activeTab === 'dashboard' && (
              <>
                <div className="welcome-banner">
                  <div className="flex flex-col">
                    <h3 className="welcome-title">Welcome back, {email === 'janithnilan@gmail.com' ? 'Janith' : 'Manager'}!</h3>
                    <p className="welcome-desc">The automotive workshop operations are running smoothly today. Here is your quick operations snapshot.</p>
                  </div>
                  <button 
                    className="quick-action-btn" 
                    onClick={() => { setActiveTab('jobcards'); handleOpenEditor(null); }}
                    id="btn-quick-job"
                  >
                    <Plus size={18} />
                    <span>Create Job Card</span>
                  </button>
                </div>

                <section className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-info">
                      <span className="stat-label">Active Job Cards</span>
                      <span className="stat-value">{jobCards.filter(c => c.status !== 'Billed' && c.status !== 'Cancelled').length}</span>
                      <span className="stat-trend trend-up">
                        <TrendingUp size={12} />
                        <span>Work-in-progress</span>
                      </span>
                    </div>
                    <div className="stat-icon-wrapper icon-blue">
                      <FileText size={22} />
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-info">
                      <span className="stat-label">In Service Today</span>
                      <span className="stat-value">{jobCards.filter(c => c.status === 'In Service').length}</span>
                      <span className="stat-trend trend-up">
                        <Activity size={12} />
                        <span>Active bay technicians</span>
                      </span>
                    </div>
                    <div className="stat-icon-wrapper icon-orange">
                      <Car size={22} />
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-info">
                      <span className="stat-label">Completed & Ready</span>
                      <span className="stat-value">{jobCards.filter(c => c.status === 'Ready').length}</span>
                      <span className="stat-trend trend-up" style={{ color: 'var(--success)' }}>
                        <CheckCircle2 size={12} />
                        <span>Awaiting billing</span>
                      </span>
                    </div>
                    <div className="stat-icon-wrapper icon-green">
                      <CheckCircle2 size={22} />
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-info">
                      <span className="stat-label">Cumulative Total Billings</span>
                      <span className="stat-value">Rs. {jobCards.reduce((sum, c) => sum + c.total, 0).toLocaleString()}</span>
                      <span className="stat-trend trend-up">
                        <TrendingUp size={12} />
                        <span>All recorded cards</span>
                      </span>
                    </div>
                    <div className="stat-icon-wrapper icon-amber">
                      <DollarSign size={22} />
                    </div>
                  </div>
                </section>

                <div className="dashboard-row">
                  {/* Recent Job Cards Table */}
                  <div className="card">
                    <div className="card-title-row">
                      <h4 className="card-title">Recent Job Cards</h4>
                      <a 
                        href="#viewall" 
                        className="card-action-link" 
                        onClick={(e) => { e.preventDefault(); setActiveTab('jobcards'); setJobCardSubView('registry'); }}
                      >
                        View All
                      </a>
                    </div>
                    <div className="table-wrapper">
                      <table className="modern-table">
                        <thead>
                          <tr>
                            <th>Job Card #</th>
                            <th>Customer</th>
                            <th>Vehicle</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Total Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobCards.slice(0, 4).map(card => (
                            <tr 
                              key={card.no} 
                              style={{ cursor: 'pointer' }}
                              onClick={() => { setActiveTab('jobcards'); handleOpenEditor(card); }}
                            >
                              <td><strong>{card.no}</strong></td>
                              <td>{card.customer}</td>
                              <td>{card.vehicle}</td>
                              <td>{card.date}</td>
                              <td><span className={`badge ${getStatusBadgeClass(card.status)}`}>{card.status}</span></td>
                              <td>Rs. {card.total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Activity feed */}
                  <div className="card">
                    <div className="card-title-row">
                      <h4 className="card-title">Recent Operations Log</h4>
                    </div>
                    <div className="activity-list">
                      <div className="activity-item">
                        <div className="activity-indicator" style={{ backgroundColor: 'var(--success)' }}></div>
                        <div className="activity-info">
                          <span className="activity-text">Job Card <strong>JC000041</strong> passed inspection</span>
                          <span className="activity-time">5 mins ago • Mechanic Perera</span>
                        </div>
                      </div>
                      <div className="activity-item">
                        <div className="activity-indicator" style={{ backgroundColor: 'var(--primary-light)' }}></div>
                        <div className="activity-info">
                          <span className="activity-text">Parts added to <strong>JC000042</strong></span>
                          <span className="activity-time">18 mins ago • Front Desk</span>
                        </div>
                      </div>
                      <div className="activity-item">
                        <div className="activity-indicator" style={{ backgroundColor: 'var(--warning)' }}></div>
                        <div className="activity-info">
                          <span className="activity-text">Stock level alert: <strong>Engine Oil 5W-30</strong> low</span>
                          <span className="activity-time">1 hr ago • System Alert</span>
                        </div>
                      </div>
                      <div className="activity-item">
                        <div className="activity-indicator" style={{ backgroundColor: 'var(--accent)' }}></div>
                        <div className="activity-info">
                          <span className="activity-text">New Customer registered: <strong>John Silva</strong></span>
                          <span className="activity-time">2 hrs ago • System</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 2. JOB CARDS TAB */}
            {activeTab === 'jobcards' && (
              <>
                {/* SUB-VIEW 2A: REGISTRY / LIST OF JOB CARDS */}
                {jobCardSubView === 'registry' && (
                  <div className="card">
                    {/* Header Filters Row */}
                    <div className="flex justify-between items-center gap-4 flex-wrap" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
                      <div className="search-wrapper">
                        <Search className="search-icon" size={18} />
                        <input 
                          type="text" 
                          className="search-input" 
                          placeholder="Search Job Card #, Customer, Vehicle..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Sliders size={16} className="text-muted" />
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status:</span>
                          <select 
                            className="form-select" 
                            style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 1rem', background: 'var(--bg-secondary)', fontSize: '0.85rem' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                          >
                            <option value="All">All Statuses</option>
                            <option value="Open">Open</option>
                            <option value="In Service">In Service</option>
                            <option value="Ready">Ready</option>
                            <option value="Billed">Billed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>

                        <button 
                          className="quick-action-btn"
                          onClick={() => handleOpenEditor(null)}
                        >
                          <Plus size={18} />
                          <span>Create Job Card</span>
                        </button>
                      </div>
                    </div>

                    {/* Job Cards Registry Table */}
                    <div className="table-wrapper" style={{ marginTop: '0.5rem' }}>
                      <table className="modern-table">
                        <thead>
                          <tr>
                            <th>Job Card #</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Vehicle No</th>
                            <th>Branch</th>
                            <th>Mileage (km)</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Total Cost</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredJobCards.length > 0 ? (
                            filteredJobCards.map(card => (
                              <tr 
                                key={card.no} 
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleOpenEditor(card)}
                              >
                                <td><strong>{card.no}</strong></td>
                                <td>{card.date}</td>
                                <td>{card.customer}</td>
                                <td><span style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 650 }}>{card.vehicle}</span></td>
                                <td>{getBranchLabel(card.branch)}</td>
                                <td>{(card.mileage).toLocaleString()} km</td>
                                <td><span className={`badge ${getStatusBadgeClass(card.status)}`}>{card.status}</span></td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>Rs. {card.total.toLocaleString()}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <button 
                                    className="logout-btn" 
                                    style={{ padding: '0.35rem' }}
                                    onClick={(e) => handleDeleteJobCard(card.no, e)}
                                    title="Delete Job Card"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                <FileText size={36} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }} />
                                No matching job cards found. Try adjusting your search query or status filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB-VIEW 2B: FULLY DYNAMIC JOB CARD EDITOR */}
                {jobCardSubView === 'editor' && (
                  <form onSubmit={handleSaveJobCard} className="w-full">
                    {/* Header Navigation Alert */}
                    {notification && (
                      <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1.5rem' }}>
                        <CheckCircle2 size={16} />
                        <span>{notification.text}</span>
                      </div>
                    )}

                    <div className="editor-grid">
                      {/* Left Panel: Header Fields (Field & Description layout) */}
                      <div className="card flex flex-col gap-4">
                        <div className="flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                          <button 
                            type="button" 
                            className="logout-btn" 
                            style={{ marginRight: '0.5rem' }} 
                            onClick={() => setJobCardSubView('registry')}
                          >
                            <ArrowLeft size={18} />
                          </button>
                          <h3 className="card-title">{editingCardId ? `Modify ${editingCardId}` : 'Create New Job Card'}</h3>
                        </div>

                        {/* Job Card Number */}
                        <div className="form-group">
                          <label className="form-label">Job Card Number</label>
                          <div className="input-wrapper">
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ opacity: 0.7, background: 'rgba(255,255,255,0.02)', fontWeight: 'bold' }} 
                              value={jcNo} 
                              disabled 
                            />
                            <FileText className="input-icon" size={18} />
                          </div>
                        </div>

                        {/* Date */}
                        <div className="form-group">
                          <label htmlFor="jc-date" className="form-label">Date Opened</label>
                          <div className="input-wrapper">
                            <input 
                              type="date" 
                              id="jc-date"
                              className="form-input" 
                              value={jcDate} 
                              onChange={(e) => setJcDate(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        {/* Customer */}
                        <div className="form-group">
                          <label htmlFor="jc-customer" className="form-label">Customer Name</label>
                          <div className="input-wrapper">
                            <input 
                              type="text" 
                              id="jc-customer"
                              className="form-input" 
                              placeholder="e.g. John Silva"
                              value={jcCustomer} 
                              onChange={(e) => setJcCustomer(e.target.value)}
                              required
                            />
                            <Mail className="input-icon" size={18} />
                          </div>
                        </div>

                        {/* Vehicle No */}
                        <div className="form-group">
                          <label htmlFor="jc-vehicle" className="form-label">Vehicle Registration No</label>
                          <div className="input-wrapper">
                            <input 
                              type="text" 
                              id="jc-vehicle"
                              className="form-input" 
                              placeholder="e.g. WP-CAB-1234"
                              value={jcVehicle} 
                              onChange={(e) => setJcVehicle(e.target.value)}
                              required
                            />
                            <Car className="input-icon" size={18} />
                          </div>
                        </div>

                        {/* Mileage */}
                        <div className="form-group">
                          <label htmlFor="jc-mileage" className="form-label">Mileage (km)</label>
                          <div className="input-wrapper">
                            <input 
                              type="number" 
                              id="jc-mileage"
                              className="form-input" 
                              placeholder="e.g. 125320"
                              value={jcMileage} 
                              onChange={(e) => setJcMileage(e.target.value !== '' ? Number(e.target.value) : '')}
                            />
                            <Activity className="input-icon" size={18} />
                          </div>
                        </div>

                        {/* Status */}
                        <div className="form-group">
                          <label htmlFor="jc-status" className="form-label">Job Status</label>
                          <div className="input-wrapper">
                            <select 
                              id="jc-status"
                              className="form-select"
                              value={jcStatus}
                              onChange={(e) => setJcStatus(e.target.value as JobCard['status'])}
                            >
                              <option value="Open">Open</option>
                              <option value="In Service">In Service</option>
                              <option value="Ready">Ready</option>
                              <option value="Billed">Billed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            <Building2 className="input-icon" size={18} />
                            <span className="select-arrow">&#9662;</span>
                          </div>
                        </div>

                        {/* Complaints */}
                        <div className="form-group">
                          <label htmlFor="jc-complaints" className="form-label">Customer Complaints & Diagnoses</label>
                          <textarea 
                            id="jc-complaints"
                            className="form-input" 
                            style={{ minHeight: '100px', resize: 'vertical', paddingLeft: '1rem' }}
                            placeholder="Describe primary vehicle issues or customer requests..."
                            value={jcComplaints} 
                            onChange={(e) => setJcComplaints(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Right Panel: Job Lines (Service & Parts Table) */}
                      <div className="card flex flex-col gap-4">
                        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                          <h3 className="card-title">Job Lines (Services & Parts)</h3>
                        </div>

                        {/* Add Job Line Form Container */}
                        <div className="flex flex-col gap-2">
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Add Work Line</span>
                          
                          <div className="add-line-bar">
                            {/* Type Selector */}
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>Line Type</label>
                              <select 
                                className="form-select" 
                                style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', fontSize: '0.85rem' }}
                                value={lineType}
                                onChange={(e) => { 
                                  setLineType(e.target.value as 'Service' | 'Part'); 
                                  setLineDesc(''); 
                                  setLinePrice(''); 
                                  setShowSuggestions(false);
                                }}
                              >
                                <option value="Service">Service</option>
                                <option value="Part">Part / Item</option>
                              </select>
                            </div>

                            {/* Autocomplete Description Field */}
                            <div className="form-group autocomplete-container" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>Description</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                placeholder={lineType === 'Service' ? "e.g. Replace Engine Oil" : "e.g. Oil Filter"}
                                value={lineDesc}
                                onChange={(e) => { setLineDesc(e.target.value); setShowSuggestions(true); }}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                onFocus={() => setShowSuggestions(true)}
                              />
                              
                              {/* Suggestions Dropdown */}
                              {showSuggestions && filteredSuggestions.length > 0 && (
                                <ul className="suggestions-list">
                                  {filteredSuggestions.map((item, index) => (
                                    <li 
                                      key={index} 
                                      className="suggestion-item"
                                      onMouseDown={() => handleSelectSuggestion(item)}
                                    >
                                      <span>{item.description}</span>
                                      <span className="suggestion-price">Rs. {item.price.toLocaleString()}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {/* Qty */}
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>Qty</label>
                              <input 
                                type="number" 
                                className="form-input" 
                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                min={1}
                                value={lineQty}
                                onChange={(e) => setLineQty(Math.max(1, Number(e.target.value)))}
                              />
                            </div>

                            {/* Price */}
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>Price (Rs.)</label>
                              <input 
                                type="number" 
                                className="form-input" 
                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                placeholder="0"
                                value={linePrice}
                                onChange={(e) => setLinePrice(e.target.value !== '' ? Number(e.target.value) : '')}
                              />
                            </div>

                            {/* Action Add Button */}
                            <button 
                              type="button" 
                              className="submit-btn" 
                              style={{ padding: '0.55rem 1rem', height: '38px', background: 'var(--primary)' }}
                              onClick={handleAddLine}
                            >
                              <PlusCircle size={16} />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>

                        {/* Current Lines Table */}
                        <div className="table-wrapper" style={{ minHeight: '180px' }}>
                          <table className="modern-table" style={{ fontSize: '0.85rem' }}>
                            <thead>
                              <tr>
                                <th>Type</th>
                                <th>Description</th>
                                <th style={{ textAlign: 'center' }}>Qty</th>
                                <th style={{ textAlign: 'right' }}>Price</th>
                                <th style={{ textAlign: 'right' }}>Subtotal</th>
                                <th style={{ textAlign: 'center' }}>Remove</th>
                              </tr>
                            </thead>
                            <tbody>
                              {jcLines.length > 0 ? (
                                jcLines.map((line, idx) => (
                                  <tr key={line.id || idx}>
                                    <td>
                                      <span className={`badge ${line.type === 'Service' ? 'badge-blue' : 'badge-warning'}`}>
                                        {line.type}
                                      </span>
                                    </td>
                                    <td>{line.description}</td>
                                    <td style={{ textAlign: 'center' }}>{line.qty}</td>
                                    <td style={{ textAlign: 'right' }}>Rs. {line.price.toLocaleString()}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>Rs. {(line.qty * line.price).toLocaleString()}</td>
                                    <td style={{ textAlign: 'center' }}>
                                      <button 
                                        type="button" 
                                        className="logout-btn" 
                                        style={{ padding: '0.2rem' }}
                                        onClick={() => handleRemoveLine(line.id)}
                                      >
                                        <Trash2 size={15} className="text-danger" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                                    No services or parts added yet. Use the inputs above to add lines to this job card.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Cost Sum Summary Card */}
                        <div 
                          style={{ 
                            borderTop: '1px solid var(--border-color)', 
                            paddingTop: '1.25rem', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                          }}
                        >
                          <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Subtotal Cost:</span>
                          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>
                            Rs. {computedTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Save Actions */}
                    <div className="editor-footer">
                      <button 
                        type="button" 
                        className="secondary-btn" 
                        onClick={() => setJobCardSubView('registry')}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="primary-btn"
                        id="btn-save-jobcard"
                      >
                        Save Job Card
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* 3. INVENTORY TAB */}
            {activeTab === 'inventory' && (
              <div className="card">
                <div className="flex justify-between items-center gap-4 flex-wrap" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
                  <h3 className="card-title">Inventory & Services Master Records</h3>
                  <button className="quick-action-btn" onClick={() => setActiveTab('jobcards')}>
                    <FileText size={18} />
                    <span>Go to Job Cards</span>
                  </button>
                </div>

                <div className="dashboard-row" style={{ marginTop: '0.5rem' }}>
                  {/* Service Master */}
                  <div className="card">
                    <h4 className="card-title" style={{ fontSize: '1rem', color: 'var(--primary-light)' }}>Services Master list</h4>
                    <div className="table-wrapper">
                      <table className="modern-table" style={{ fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th style={{ textAlign: 'right' }}>Default Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {serviceMaster.map((srv, idx) => (
                            <tr key={idx}>
                              <td>{srv.description}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>Rs. {srv.price.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Items/Parts Master */}
                  <div className="card">
                    <h4 className="card-title" style={{ fontSize: '1rem', color: 'var(--accent)' }}>Spare Parts Master list</h4>
                    <div className="table-wrapper">
                      <table className="modern-table" style={{ fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th style={{ textAlign: 'right' }}>Default Unit Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemMaster.map((itm, idx) => (
                            <tr key={idx}>
                              <td>{itm.description}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>Rs. {itm.price.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. SETTINGS CONFIG TAB */}
            {activeTab === 'settings' && (
              <div className="card" style={{ textAlign: 'left', maxWidth: '640px', margin: '0 auto' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1rem' }}>
                  <h3 className="card-title">ERP Settings & Configurations</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Customize global ERP workflows and Master Registry auto-creation settings.</p>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Workflow Setting 1 */}
                  <div className="flex flex-col gap-2">
                    <h4 className="card-title" style={{ fontSize: '0.95rem' }}>Service/Item Master Creation Logic</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.35' }}>
                      Determine how the system handles new descriptions entered in Job Card lines that do not exist in the Master Registry.
                    </p>

                    <div className="flex flex-col gap-2" style={{ marginTop: '0.5rem' }}>
                      <label className="checkbox-label" htmlFor="opt-auto">
                        <input 
                          type="radio" 
                          id="opt-auto" 
                          name="master-logic"
                          className="checkbox-input"
                          style={{ borderRadius: '50%' }}
                          checked={autoCreateService && !requireConfirmation}
                          onChange={() => { setAutoCreateService(true); setRequireConfirmation(false); }}
                        />
                        <div className="flex flex-col">
                          <span style={{ fontWeight: 600 }}>Auto-create master records in background (Configured)</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Accepts the typing and creates the Service/Item Master entry silently upon line addition.</span>
                        </div>
                      </label>

                      <label className="checkbox-label" htmlFor="opt-confirm" style={{ marginTop: '0.5rem' }}>
                        <input 
                          type="radio" 
                          id="opt-confirm" 
                          name="master-logic"
                          className="checkbox-input"
                          style={{ borderRadius: '50%' }}
                          checked={!autoCreateService && requireConfirmation}
                          onChange={() => { setAutoCreateService(false); setRequireConfirmation(true); }}
                        />
                        <div className="flex flex-col">
                          <span style={{ fontWeight: 600 }}>Prompt/Ask for confirmation before creating</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Asks the operator via pop-up whether to save the new item in the Master registry.</span>
                        </div>
                      </label>

                      <label className="checkbox-label" htmlFor="opt-strict" style={{ marginTop: '0.5rem' }}>
                        <input 
                          type="radio" 
                          id="opt-strict" 
                          name="master-logic"
                          className="checkbox-input"
                          style={{ borderRadius: '50%' }}
                          checked={!autoCreateService && !requireConfirmation}
                          onChange={() => { setAutoCreateService(false); setRequireConfirmation(false); }}
                        />
                        <div className="flex flex-col">
                          <span style={{ fontWeight: 600 }}>Strict mode (Restrict creation)</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Only allow selecting existing master services/parts. Adding new master records is disabled.</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Settings status summary */}
                  <div 
                    style={{ 
                      background: 'rgba(37, 99, 235, 0.05)', 
                      border: '1px solid rgba(37, 99, 235, 0.15)', 
                      padding: '1rem', 
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      marginTop: '1rem'
                    }}
                  >
                    <AlertCircle size={18} className="text-success" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                    <div className="flex flex-col">
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>Settings Active</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Changes are stored in the application session. Future PostgreSQL migrations will store this config per branch.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </main>
      </div>
    )
  }

  // --- RENDER LOGIN VIEW ---
  return (
    <div className="login-container">
      <div className="glow-blur-1"></div>
      <div className="glow-blur-2"></div>
      
      <section className="login-hero" aria-label="AutoServe ERP features">
        <div className="hero-header">
          <div className="logo-icon-wrapper">
            <Wrench className="logo-icon" size={24} color="white" />
          </div>
          <h1 className="logo-text">AutoServe ERP</h1>
        </div>
        
        <div className="hero-body">
          <h2 className="hero-title">Automotive Workshop Operations, Simplified.</h2>
          <p className="hero-subtitle">
            Streamline your entire garage operations with a high-fidelity system designed for high-volume service workshops. Complete control over job cards, inventory, billing, and mechanics.
          </p>
          
          <div className="hero-features">
            <div className="feature-item">
              <div className="feature-icon-box">
                <FileText size={18} />
              </div>
              <div className="flex flex-col">
                <span className="feature-title">Smart Job Cards</span>
                <span className="feature-desc">Track customer complaints, inspections, service lines, parts, and active status in real-time.</span>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon-box">
                <Wrench size={18} />
              </div>
              <div className="flex flex-col">
                <span className="feature-title">Adaptive Service & Item Masters</span>
                <span className="feature-desc">Auto-creates masters based on inputs, customizable workflow logic to scale with your shop.</span>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon-box">
                <TrendingUp size={18} />
              </div>
              <div className="flex flex-col">
                <span className="feature-title">Seamless Invoicing & Accounting</span>
                <span className="feature-desc">Instantly convert job cards into printable invoices, with upcoming accounting integrations.</span>
              </div>
            </div>
          </div>
        </div>
        
        <footer className="hero-footer">
          <span>&copy; {new Date().getFullYear()} AutoServe ERP. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <span className="activity-indicator" style={{ backgroundColor: 'var(--success)', width: 6, height: 6 }}></span>
            <span>All Systems Operational (v1.0.0)</span>
          </div>
        </footer>
      </section>

      <section className="login-form-section" aria-label="Sign In form">
        <div className="mobile-logo-header">
          <div className="logo-icon-wrapper" style={{ width: 36, height: 36 }}>
            <Wrench className="logo-icon" size={18} color="white" />
          </div>
          <span className="logo-text" style={{ fontSize: '1.25rem' }}>AutoServe ERP</span>
        </div>

        <div className="login-form-card">
          <header className="form-header">
            <h2 className="form-title">Operator Sign In</h2>
            <p className="form-subtitle">Enter your workspace credentials to access the ERP</p>
          </header>
          
          {errorMsg && (
            <div className="alert alert-danger" role="alert" id="error-alert">
              <AlertCircle size={16} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSignInSubmit} id="login-form">
            <div className="form-group">
              <label htmlFor="branch-select" className="form-label">
                <Building2 size={15} />
                <span>Operating Branch</span>
              </label>
              <div className="input-wrapper">
                <select 
                  id="branch-select" 
                  className="form-select"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                >
                  <option value="colombo">Colombo Branch (HQ)</option>
                  <option value="kandy">Kandy Branch</option>
                  <option value="galle">Galle Branch</option>
                </select>
                <Building2 className="input-icon" size={18} />
                <span className="select-arrow">&#9662;</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email-input" className="form-label">
                <Mail size={15} />
                <span>Work Email Address</span>
              </label>
              <div className="input-wrapper">
                <input 
                  type="email" 
                  id="email-input" 
                  className="form-input" 
                  placeholder="name@autoserve.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <Mail className="input-icon" size={18} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password-input" className="form-label">
                <Lock size={15} />
                <span>Security Password</span>
              </label>
              <div className="input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password-input" 
                  className="form-input" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <Lock className="input-icon" size={18} />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label" htmlFor="chk-remember">
                <input 
                  type="checkbox" 
                  id="chk-remember" 
                  className="checkbox-input"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="forgot-link" onClick={() => setErrorMsg('Password recovery has been disabled for security. Please contact your system administrator.')}>Forgot Password?</a>
            </div>

            <button 
              type="submit" 
              className="submit-btn" 
              disabled={isLoading}
              id="btn-signin"
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>

          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem', textAlign: 'center' }}>
              QUICK LOGIN HELPER FOR TESTING
            </span>
            <div className="flex gap-2" style={{ width: '100%' }}>
              <button 
                type="button" 
                className="submit-btn" 
                style={{ 
                  background: 'rgba(255,255,255,0.04)', 
                  border: '1px solid var(--border-color)', 
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  padding: '0.5rem',
                  boxShadow: 'none'
                }}
                onClick={() => handleQuickLogin('admin')}
                id="btn-demo-admin"
              >
                Janith (Admin)
              </button>
              <button 
                type="button" 
                className="submit-btn" 
                style={{ 
                  background: 'rgba(255,255,255,0.04)', 
                  border: '1px solid var(--border-color)', 
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  padding: '0.5rem',
                  boxShadow: 'none'
                }}
                onClick={() => handleQuickLogin('manager')}
                id="btn-demo-manager"
              >
                Manager
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App
