import React, { useState } from 'react';

const BotForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    botToken: '',
    chatId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.url.trim() || !formData.botToken.trim() || !formData.chatId.trim()) {
      alert('Please fill in all required fields (name, URL, bot token, and chat ID)');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      setFormData({ name: '', url: '', description: '', botToken: '', chatId: '' });
    } catch (error) {
      console.error('Error creating bot:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create New Bot</h2>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">📋 Requirements</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Create a Telegram bot via <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="underline">@BotFather</a> to get your bot token</li>
          <li>• Get your chat ID by messaging <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="underline">@userinfobot</a></li>
          <li>• Each bot will send notifications to its own Telegram chat</li>
        </ul>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-600 mb-2">
            Bot Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., iPhone Scraper"
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-semibold text-gray-600 mb-2">
            eBay Search URL *
          </label>
          <input
            type="url"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="https://www.ebay.com/sch/i.html?_nkw=your+search+terms"
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-600 mb-2">
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of what this bot searches for..."
            rows="3"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-primary-500 transition-colors resize-y"
          />
        </div>

        <div>
          <label htmlFor="botToken" className="block text-sm font-semibold text-gray-600 mb-2">
            Telegram Bot Token *
          </label>
          <input
            type="text"
            id="botToken"
            name="botToken"
            value={formData.botToken}
            onChange={handleChange}
            placeholder="e.g., 1234567890:AAHWrewbsMzl4L9r_T5IdFOeQUQZm0RPhbE"
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-primary-500 transition-colors font-mono"
          />
        </div>

        <div>
          <label htmlFor="chatId" className="block text-sm font-semibold text-gray-600 mb-2">
            Telegram Chat ID *
          </label>
          <input
            type="text"
            id="chatId"
            name="chatId"
            value={formData.chatId}
            onChange={handleChange}
            placeholder="e.g., 7180625231"
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-primary-500 transition-colors font-mono"
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Bot...' : 'Create Bot'}
        </button>
      </form>
    </div>
  );
};

export default BotForm;
