.PHONY: figures flatten pdf clean

figures:
	python scripts/generate_figures.py

flatten:
	python scripts/flatten.py --root main.tex --output paper.tex

pdf: figures flatten
	pdflatex -interaction=nonstopmode paper.tex
	bibtex paper
	pdflatex -interaction=nonstopmode paper.tex
	pdflatex -interaction=nonstopmode paper.tex

clean:
	rm -f *.aux *.bbl *.blg *.log *.out main.pdf paper.pdf paper.tex
