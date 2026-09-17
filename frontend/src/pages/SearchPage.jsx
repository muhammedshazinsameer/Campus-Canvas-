import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSubmissions, getCategories, getTags } from '../api/client';
import PieceCard from '../components/PieceCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Search, Filter, SlidersHorizontal, Tag, RotateCcw } from 'lucide-react';

const TYPES = ['All', 'Poetry', 'Fiction', 'Essay', 'Poster', 'Art', 'Photography'];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Title (A–Z)', value: 'title_asc' },
  { label: 'Title (Z–A)', value: 'title_desc' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State derived from URL query parameters
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'All');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'newest');

  const [submissions, setSubmissions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load filter metadata once
  useEffect(() => {
    async function loadMeta() {
      try {
        const [catData, tagData] = await Promise.all([getCategories(), getTags()]);
        setCategories(catData.categories || []);
        setTags(tagData.tags || []);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    }
    loadMeta();
  }, []);

  // Fetch results whenever filters change
  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        const params = {
          sort: sortOption,
          limit: 60
        };

        if (selectedType !== 'All') params.type = selectedType;
        if (selectedCategory !== 'All') params.category = selectedCategory;
        if (selectedTag) params.tag = selectedTag;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const data = await getSubmissions(params);
        setSubmissions(data.submissions || []);
        setTotalCount(data.total || 0);

        // Synchronize search params in URL
        const newParams = {};
        if (selectedType !== 'All') newParams.type = selectedType;
        if (selectedCategory !== 'All') newParams.category = selectedCategory;
        if (selectedTag) newParams.tag = selectedTag;
        if (searchQuery.trim()) newParams.q = searchQuery.trim();
        if (sortOption !== 'newest') newParams.sort = sortOption;
        setSearchParams(newParams, { replace: true });
      } catch (err) {
        console.error('Failed to fetch search results:', err);
      } finally {
        setLoading(false);
      }
    }

    const timeout = setTimeout(() => {
      fetchResults();
    }, 250); // slight debounce for search input

    return () => clearTimeout(timeout);
  }, [selectedType, selectedCategory, selectedTag, searchQuery, sortOption]);

  const resetFilters = () => {
    setSelectedType('All');
    setSelectedCategory('All');
    setSelectedTag('');
    setSearchQuery('');
    setSortOption('newest');
  };

  const hasActiveFilters =
    selectedType !== 'All' ||
    selectedCategory !== 'All' ||
    selectedTag !== '' ||
    searchQuery.trim() !== '' ||
    sortOption !== 'newest';

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="border-b border-[#e8e2d2] pb-6 mb-8">
        <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1a1917] mb-2">
          Search Catalog
        </h2>
        <p className="text-sm text-[#787163] font-serif italic">
          Explore curated student works across poetry, literature, and visual arts. Filter by medium, genre, author pen name, or keyword.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#fcfbf9] border border-[#e8e2d2] p-5 rounded-sm shadow-sm mb-8 space-y-4">
        {/* Top row: Search input + Sort dropdown */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8477]" />
            <input
              type="text"
              placeholder="Search by title, author pen name, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#faf7f0] border border-[#d5ccba] rounded text-sm text-[#1a1917] placeholder-[#8c8477] focus:outline-none focus:border-[#9d4233] focus:ring-1 focus:ring-[#9d4233]"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#787163]" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3 py-2 bg-[#faf7f0] border border-[#d5ccba] rounded text-sm text-[#1a1917] focus:outline-none focus:border-[#9d4233]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Medium Type Tabs */}
        <div>
          <div className="text-xs uppercase tracking-wider text-[#8c8477] font-sans font-semibold mb-2">
            Medium / Format
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((type) => {
              const active = selectedType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    active
                      ? 'bg-[#9d4233] text-white shadow-sm'
                      : 'bg-[#f4efe4] text-[#433e38] hover:bg-[#e8e2d2]'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-Filters: Category & Active Tags */}
        <div className="pt-2 border-t border-[#f0eadc] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Category selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#8c8477] uppercase tracking-wider font-semibold">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1 bg-[#faf7f0] border border-[#d5ccba] rounded text-xs text-[#1a1917] focus:outline-none focus:border-[#9d4233]"
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag selector */}
            {tags.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#8c8477] uppercase tracking-wider font-semibold">Tag:</span>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="px-2.5 py-1 bg-[#faf7f0] border border-[#d5ccba] rounded text-xs text-[#1a1917] focus:outline-none focus:border-[#9d4233]"
                >
                  <option value="">All Tags</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.name}>
                      #{t.name} ({t.count})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-[#9d4233] hover:text-[#78281b] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6 text-xs text-[#787163] uppercase tracking-wider">
        <span>
          Showing {submissions.length} of {totalCount} published works
        </span>
        {selectedTag && (
          <span className="bg-[#f0e8dc] text-[#9d4233] px-2 py-0.5 rounded">
            Filtered by #{selectedTag}
          </span>
        )}
      </div>

      {/* Content State */}
      {loading ? (
        <LoadingSpinner message="Searching the literary archive..." />
      ) : submissions.length === 0 ? (
        <div className="text-center py-20 bg-[#f9f6ef] border border-[#ece6d8] rounded p-8">
          <p className="font-serif italic text-lg text-[#635d54] mb-3">
            No approved works match your search criteria.
          </p>
          <p className="text-xs text-[#8c8477] mb-6">
            Try loosening your filters or searching with alternative keywords.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 border border-[#9d4233] text-[#9d4233] rounded text-xs font-medium hover:bg-[#9d4233] hover:text-white transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((piece) => (
            <PieceCard key={piece.id} piece={piece} />
          ))}
        </div>
      )}
    </div>
  );
}
