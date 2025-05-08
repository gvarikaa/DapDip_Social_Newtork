"use client";

import { useState } from 'react';
import { Radio, Video, AlertCircle, Check, X } from 'lucide-react';

type LiveStreamOptionsProps = {
  onClose: () => void;
  onSave: (options: LiveStreamOptions) => void;
};

export type LiveStreamOptions = {
  title: string;
  description: string;
  scheduled: boolean;
  scheduledDate?: Date;
};

const PostLiveStream = ({ onClose, onSave }: LiveStreamOptionsProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ვალიდაცია
    if (!title.trim()) {
      setError('გთხოვთ, შეიყვანოთ სტრიმის სათაური');
      return;
    }
    
    if (isScheduled && !scheduledDate) {
      setError('გთხოვთ, შეიყვანოთ დაგეგმილი თარიღი');
      return;
    }
    
    // ახლანდელი დროის შემოწმება
    if (isScheduled && new Date(scheduledDate) <= new Date()) {
      setError('დაგეგმილი თარიღი უნდა იყოს მომავალში');
      return;
    }
    
    // პარამეტრების შენახვა
    onSave({
      title,
      description,
      scheduled: isScheduled,
      scheduledDate: isScheduled ? new Date(scheduledDate) : undefined
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-secondary-dark rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-4 border-b border-borderGray-dark flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500" />
            ლაივ სტრიმის შექმნა
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-secondary-light transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary mb-4">
              <Video className="w-6 h-6 text-red-500" />
              <div className="text-gray-300 text-sm">
                შექმენით ლაივ სტრიმი თქვენს ჯგუფში ადვილად. შეავსეთ დეტალები და დაიწყეთ სტრიმი ან დაგეგმეთ ის მომავალში.
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 mb-4 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-gray-300 text-sm mb-1">
                სტრიმის სათაური *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="შეიყვანეთ სტრიმის სათაური"
                className="w-full bg-secondary border border-borderGray-dark rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-gray-300 text-sm mb-1">
                აღწერა (არაა აუცილებელი)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="მოკლე აღწერა სტრიმის შესახებ"
                className="w-full bg-secondary border border-borderGray-dark rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-accent min-h-24 resize-none"
              />
            </div>
            
            <div>
              <div className="flex items-center mb-2">
                <input
                  id="scheduled"
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="w-4 h-4 accent-accent mr-2"
                />
                <label htmlFor="scheduled" className="text-gray-300 text-sm">
                  დაგეგმილი სტრიმი
                </label>
              </div>
              
              {isScheduled && (
                <div>
                  <label htmlFor="scheduledDate" className="block text-gray-300 text-sm mb-1">
                    დაგეგმილი თარიღი და დრო *
                  </label>
                  <input
                    id="scheduledDate"
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-secondary border border-borderGray-dark rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                    required={isScheduled}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end mt-6 gap-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-secondary text-gray-300 rounded-lg hover:bg-secondary-light hover:text-white transition-colors"
            >
              გაუქმება
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              {isScheduled ? 'დაგეგმვა' : 'დაწყება'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostLiveStream;