import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Plus, Edit2, Trash, Download, Sun, Moon, Lock } from 'lucide-react';

export default function PortfolioShowroom() {
  const [projects, setProjects] = useState([]);
  const [theme, setTheme] = useState('light');
  const [editingProject, setEditingProject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', image: '', link: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    setIsAdmin(adminStatus);
  }, []);

  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('theme', theme);
    localStorage.setItem('isAdmin', isAdmin);
  }, [projects, theme, isAdmin]);

  const handleSave = () => {
    if (!formData.title.trim()) return;
    if (editingProject) {
      setProjects(projects.map(p => p.id === editingProject.id ? { ...formData, id: editingProject.id } : p));
    } else {
      setProjects([...projects, { ...formData, id: Date.now() }]);
    }
    setShowForm(false);
    setFormData({ title: '', description: '', image: '', link: '' });
    setEditingProject(null);
  };

  const handleEdit = (p) => {
    setEditingProject(p);
    setFormData(p);
    setShowForm(true);
  };

  const handleDelete = (id) => setProjects(projects.filter(p => p.id !== id));

  const exportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(projects, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = 'portfolio_data.json';
    link.click();
  };

  const handleLogin = () => {
    if (passwordInput === 'diamondadmin') {
      setIsAdmin(true);
      setShowLogin(false);
      setPasswordInput('');
    } else {
      alert('Incorrect password!');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
  };

  return (
    <div className={`min-h-screen font-sans transition-all duration-300 ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <header className="flex justify-between items-center px-8 py-6 border-b border-gray-200 dark:border-gray-800 bg-opacity-80 backdrop-blur-md sticky top-0 z-50">
        <h1 className="text-2xl font-bold">💎 D1AM0ND5 Portfolio</h1>
        <div className="flex gap-3 items-center">
          <Button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </Button>
          {isAdmin ? (
            <>
              <Button onClick={() => setShowForm(true)}><Plus size={18} className="mr-1" /> Add Project</Button>
              <Button onClick={exportData}><Download size={18} className="mr-1" /> Export</Button>
              <Button variant="destructive" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setShowLogin(true)}><Lock size={16} className="mr-1" /> Admin</Button>
          )}
        </div>
      </header>

      <section className="text-center py-24 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 text-white shadow-inner">
        <h2 className="text-6xl font-extrabold mb-6 drop-shadow-lg">Showcase Your Digital Creations</h2>
        <p className="text-xl max-w-3xl mx-auto mb-8 text-gray-100">A dynamic portfolio website built to grow with your creative journey — from Roblox scripting to AI-powered experiences and beyond.</p>
        <Button className="bg-white text-gray-900 font-semibold hover:bg-gray-200 px-6 py-3 rounded-full transition">Explore Projects</Button>
      </section>

      <section className="max-w-5xl mx-auto px-8 py-20 text-center">
        <h3 className="text-4xl font-bold mb-8 text-indigo-600">About Me</h3>
        <p className="text-lg leading-relaxed text-black max-w-3xl mx-auto">
          I'm <strong className="text-indigo-600">D1AM0ND5</strong>, a passionate digital creator and developer with over <strong>2–3 years</strong> of experience in this field. 
          Over this journey, I’ve proudly served more than <strong>50 clients</strong>, delivering high-quality work across scripting, building, animation, and VFX. 
          <br /><br />
          My focus is on innovation, precision, and creativity — whether it's crafting immersive Roblox experiences, designing powerful AI-driven NPCs, or developing futuristic prototypes.
          This site represents my evolution as a creator — one project at a time.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-8 py-20 bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-lg">
        <h3 className="text-4xl font-bold mb-10 text-center text-indigo-600">Skills</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {['Scripting', 'Building', 'Animation', 'VFX', 'UI Design', 'AI Systems', 'Prototyping', 'Optimization'].map(skill => (
            <div key={skill} className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-2xl transition text-lg font-medium text-gray-800 dark:text-gray-200">{skill}</div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-8 py-20">
        <h3 className="text-4xl font-bold mb-10 text-center text-indigo-600">Projects</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {projects.map((p) => (
            <Card key={p.id} className="overflow-hidden shadow-lg hover:shadow-2xl transition-all border dark:border-gray-700 bg-white dark:bg-gray-800">
              <img src={p.image || 'https://via.placeholder.com/400x250?text=Project+Image'} alt={p.title} className="h-56 w-full object-cover" />
              <CardHeader>
                <h4 className="text-xl font-semibold text-indigo-600">{p.title}</h4>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800 mb-4">{p.description}</p>
                <div className="flex justify-between items-center">
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-medium hover:underline">View</a>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Edit2 size={16} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash size={16} /></Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {projects.length === 0 && <p className="text-center text-gray-600 mt-10">No projects yet — {isAdmin ? 'click “Add Project” to get started!' : 'check back soon!'}</p>}
      </section>

      <section className="max-w-5xl mx-auto px-8 py-20">
        <h3 className="text-4xl font-bold mb-8 text-center text-indigo-600">Contact Me</h3>
        <form className="grid gap-4 max-w-md mx-auto">
          <input placeholder="Your Name" className="p-3 rounded-md border" />
          <input placeholder="Your Email" className="p-3 rounded-md border" />
          <textarea placeholder="Your Message" className="p-3 rounded-md border h-32" />
          <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-md">Send</Button>
        </form>
      </section>

      <footer className="text-center py-8 border-t border-gray-200 mt-12 text-gray-700">
        <p className="text-sm">© {new Date().getFullYear()} D1AM0ND5. Built with ❤️ using React & TailwindCSS.</p>
      </footer>

      {showLogin && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-semibold mb-4 text-indigo-600">Admin Login</h3>
            <input type="password" placeholder="Enter Admin Password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full mb-3 p-3 border rounded-md" />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowLogin(false)}>Cancel</Button>
              <Button onClick={handleLogin}>Login</Button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-semibold mb-4 text-indigo-600">{editingProject ? 'Edit Project' : 'Add New Project'}</h3>
            <input placeholder="Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full mb-3 p-3 border rounded-md" />
            <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full mb-3 p-3 border rounded-md" />
            <input placeholder="Image URL" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="w-full mb-3 p-3 border rounded-md" />
            <input placeholder="Project Link" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} className="w-full mb-3 p-3 border rounded-md" />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingProject ? 'Update' : 'Save'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
