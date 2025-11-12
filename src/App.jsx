import React, { useState, useEffect } from 'react'
import Search from './components/Search'
import { Spinner } from "flowbite-react";
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use'
import { updateSearchCount, getTrendingMovies } from './appwrite';

const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const API_OPTIONS = {
    method: 'GET',
    headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`
    }
}

const App = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [deBouncedSearchTerm, setDeBouncedSearchTerm] = useState('')
    
    const [movieList, setMovieList] = useState([])
    const [errorMessage, setErrorMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    
    const [trendingMovies, setTrendingMovies] = useState([])

    // Debounce the search term to prevent making too many API calls
    // by waiting for the user to stop typing for 500ms
    useDebounce(() => setDeBouncedSearchTerm(searchTerm), 500, [searchTerm]);

    const fetchMovies = async (query = '') => {
        setIsLoading(true)
        setErrorMessage('')

        try {
            const endpoint = query
            ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
            : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`

            const response = await fetch(endpoint, API_OPTIONS)
            if (!response.ok) {
                throw new Error('Failed to fetch movies')
            }

            const data = await response.json()
            
            if(data.Response == false) {
                setErrorMessage(data.Error || 'Failed to fetch movies')
                setMovieList([])
                return
            }

            setMovieList(data.results || [])

            if (query && data.results.length > 0) {
                updateSearchCount(query, data.results[0])
            }

        } catch (error) {
            console.error(`Error fetching movies: ${error}`)
            setErrorMessage('Error fetching movies. Please try again later.')
        } finally {
            setIsLoading(false)
        }
    }

    const loadTrendingMovies = async () => {
        try {
           const movies = await getTrendingMovies();
           setTrendingMovies(movies); 
        } catch (error) {
            console.error('Error loading trending movies:', error);
        }
    }

    useEffect(() => {
        fetchMovies(deBouncedSearchTerm)
    }, [deBouncedSearchTerm])

    useEffect(() => {
        loadTrendingMovies();
    }, [])

    return (
        <main>
            <div className="pattern">

            </div>
            <div className="wrapper">
                <header>
                    <img src="./hero.png" alt="Hero banner" />
                    <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle</h1>
                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
                </header>

                {trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2>Trending Movies</h2>

                        <ul>
                            {trendingMovies.map((movie, index) => (
                                <li key={movie.id}>
                                    <p>{index + 1}</p>
                                    <img src={movie.poster_url} alt={movie.title} />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className="all-movies">
                    <h2 className="mt-[40px]">All Movies</h2>
                    {isLoading ? (
                        <Spinner color="info" />
                    ) : errorMessage ? (
                        <p className="text-red-500">{errorMessage}</p>
                    ) :  (
                        <ul>
                            {movieList.map((movie) => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    )
}

export default App