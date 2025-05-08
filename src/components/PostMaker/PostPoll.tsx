"use client";

import { useState } from 'react';
import { BarChart3, PlusCircle, X, MinusCircle, CalendarClock, Check, Info } from 'lucide-react';

type PollOption = {
  id: string;
  text: string;
};

export type PollConfig = {
  question: string;
  options: PollOption[];
  allowMultipleAnswers: boolean;
  isAnonymous: boolean;
  endDate?: Date;
};

type PostPollProps = {
  onClose: () => void;
  onSave: (pollConfig: PollConfig) => void;
};

const PostPoll = ({ onClose, onSave }: PostPollProps) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' }
  ]);
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const addOption = () => {
    if (options.length >= 10) {
      setError('მაქსიმუმ 10 ვარიანტის დამატება შეგიძლიათ');
      return;
    }
    
    const newId = (Math.max(...options.map(o => parseInt(o.id)), 0) + 1).toString();
    setOptions([...options, { id: newId, text: '' }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) {
      setError('მინიმუმ 2 ვარიანტი უნდა იყოს');
      return;
    }
    setOptions(options.filter(option => option.id !== id));
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(option => 
      option.id === id ? { ...option, text } : option
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ვალიდაცია
    if (!question.trim()) {
      setError('გთხოვთ, შეიყვანოთ კითხვა');
      return;
    }
    
    const emptyOptions = options.filter(option => !option.text.trim());
    if (emptyOptions.length > 0) {
      setError('გთხოვთ შეავსოთ ყველა ვარიანტი');
      return;
    }
    
    if (hasEndDate && !endDate) {
      setError('გთხოვთ, შეიყვანოთ დასრულების თარიღი');
      return;
    }
    
    // თარიღის ვალიდაცია
    if (hasEndDate && new Date(endDate) <= new Date()) {
      setError('დასრულების თარიღი უნდა იყოს მომავალში');
      return;
    }
    
    // კონფიგურაციის შენახვა
    onSave({
      question,
      options,
      allowMultipleAnswers,
      isAnonymous,
      endDate: hasEndDate ? new Date(endDate) : undefined
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-secondary-dark rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-4 border-b border-borderGray-dark flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            გამოკითხვის შექმნა
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-secondary-light transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 mb-4 text-red-400 text-sm">
              <Info className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="question" className="block text-gray-300 text-sm mb-1">
                კითხვა *
              </label>
              <input
                id="question"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="შეიყვანეთ გამოკითხვის კითხვა"
                className="w-full bg-secondary border border-borderGray-dark rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm mb-1">
                ვარიანტები *
              </label>
              <div className="space-y-2">
                {options.map(option => (
                  <div key={option.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateOption(option.id, e.target.value)}
                      placeholder={`ვარიანტი ${option.id}`}
                      className="flex-1 bg-secondary border border-borderGray-dark rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => removeOption(option.id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="ვარიანტის წაშლა"
                    >
                      <MinusCircle className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                
                <button 
                  type="button" 
                  onClick={addOption}
                  className="flex items-center gap-1 mt-2 text-accent hover:text-accent-light transition-colors text-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  ვარიანტის დამატება
                </button>
              </div>
            </div>
            
            <div className="space-y-2 pt-2">
              <div className="flex items-center">
                <input
                  id="multipleAnswers"
                  type="checkbox"
                  checked={allowMultipleAnswers}
                  onChange={(e) => setAllowMultipleAnswers(e.target.checked)}
                  className="w-4 h-4 accent-accent mr-2"
                />
                <label htmlFor="multipleAnswers" className="text-gray-300 text-sm">
                  რამდენიმე პასუხის არჩევის უფლება
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="anonymous"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 accent-accent mr-2"
                />
                <label htmlFor="anonymous" className="text-gray-300 text-sm">
                  ანონიმური გამოკითხვა
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="hasEndDate"
                  type="checkbox"
                  checked={hasEndDate}
                  onChange={(e) => setHasEndDate(e.target.checked)}
                  className="w-4 h-4 accent-accent mr-2"
                />
                <label htmlFor="hasEndDate" className="text-gray-300 text-sm">
                  გამოკითხვის დასრულების თარიღი
                </label>
              </div>
              
              {hasEndDate && (
                <div>
                  <div className="flex items-center gap-2 text-gray-300 text-sm mb-1">
                    <CalendarClock className="w-4 h-4" />
                    დასრულების თარიღი და დრო
                  </div>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-secondary border border-borderGray-dark rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                    required={hasEndDate}
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
              შექმნა
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostPoll;